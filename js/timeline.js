// ============================================
// Timeline Acara Module
// ============================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { checkAuth, applyRoleAccess, initSidebar, getUserRole, showToast } from './auth.js';

// ============================================
// Initialize
// ============================================
async function init() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  initSidebar('timeline');
  applyRoleAccess();
  setupEventListeners();
  await loadAcara();
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  const modal = document.getElementById('modal-acara');
  const btnAdd = document.getElementById('btn-add-acara');
  const btnCancel = document.getElementById('btn-cancel');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('form-acara').reset();
      modal.classList.add('active');
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Form submit
  document.getElementById('form-acara').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addAcara();
  });
}

// ============================================
// Load Acara
// ============================================
async function loadAcara() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:32px;"><div class="spinner"></div></div>';

  try {
    const snapshot = await getDocs(collection(db, 'acara'));

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Belum ada acara yang ditambahkan</p>
        </div>`;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isAdmin = getUserRole() === 'admin';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Sort client-side: upcoming first (asc), then past (desc)
    const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const upcoming = allDocs.filter(d => d.tanggal >= today).sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const past = allDocs.filter(d => d.tanggal < today).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const sorted = [...upcoming, ...past];

    container.innerHTML = sorted.map((event, index) => {
      const date = new Date(event.tanggal + 'T00:00:00');
      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const formattedDate = `${dayName}, ${date.getDate()} ${monthName} ${date.getFullYear()}`;
      const isUpcoming = event.tanggal >= today;
      const isPast = event.tanggal < today;

      return `
        <div class="timeline-item ${isUpcoming ? 'upcoming' : ''}" style="animation: fadeInUp ${0.2 + index * 0.1}s ease-out">
          <div class="timeline-card" style="${isPast ? 'opacity:0.5;' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div class="event-name">${escapeHtml(event.namaKegiatan)}</div>
              ${isAdmin ? `<button class="btn-danger" onclick="deleteAcara('${event.id}')">Hapus</button>` : ''}
            </div>
            <div class="event-meta">
              <span><span class="icon">📅</span> ${formattedDate}</span>
              <span><span class="icon">📍</span> ${escapeHtml(event.lokasi)}</span>
              <span><span class="icon">🕐</span> ${escapeHtml(event.jam)}</span>
            </div>
            ${isUpcoming ? '<div style="margin-top:10px;"><span class="badge masuk" style="font-size:11px;">Mendatang</span></div>' : ''}
          </div>
        </div>`;
    }).join('');
  } catch (error) {
    console.error('Error loading acara:', error);
    container.innerHTML = '<div style="text-align:center;color:var(--danger);padding:32px;">Gagal memuat data</div>';
  }
}

// ============================================
// Add Acara
// ============================================
async function addAcara() {
  const namaKegiatan = document.getElementById('acara-nama').value.trim();
  const tanggal = document.getElementById('acara-tanggal').value;
  const lokasi = document.getElementById('acara-lokasi').value.trim();
  const jam = document.getElementById('acara-jam').value;

  if (!namaKegiatan || !tanggal || !lokasi || !jam) {
    showToast('Lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'acara'), {
      namaKegiatan,
      tanggal,
      lokasi,
      jam,
      createdAt: serverTimestamp()
    });

    document.getElementById('modal-acara').classList.remove('active');
    showToast('Acara berhasil ditambahkan', 'success');
    await loadAcara();
  } catch (error) {
    console.error('Error adding acara:', error);
    showToast('Gagal menambahkan acara', 'error');
  }
}

// ============================================
// Delete Acara
// ============================================
async function deleteAcaraFn(id) {
  if (!confirm('Yakin ingin menghapus acara ini?')) return;

  try {
    await deleteDoc(doc(db, 'acara', id));
    showToast('Acara berhasil dihapus', 'success');
    await loadAcara();
  } catch (error) {
    console.error('Error deleting acara:', error);
    showToast('Gagal menghapus acara', 'error');
  }
}

// ============================================
// Utilities
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose to global
window.deleteAcara = deleteAcaraFn;

// Initialize
init();
