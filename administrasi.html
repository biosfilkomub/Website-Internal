// ============================================
// Administrasi Module - Surat Masuk & Keluar
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

let currentTab = 'keluar';

// Drive archive links
const DRIVE_LINKS = {
  masuk: 'https://drive.google.com/drive/folders/1DAUodas1l3PauB24wiIHBrJf28KgDyl1?usp=drive_link',
  keluar: 'https://drive.google.com/drive/folders/1CFnCjWX2QhTZ8N0eYmA4zrrTsVS9-HU2?usp=drive_link'
};

// ============================================
// Initialize
// ============================================
async function init() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  initSidebar('administrasi');
  applyRoleAccess();
  setupEventListeners();
  updateDriveLink();
  await loadSurat();
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      updateDriveLink();
      loadSurat();
    });
  });

  // Modal open/close
  const modal = document.getElementById('modal-surat');
  const btnAdd = document.getElementById('btn-add-surat');
  const btnCancel = document.getElementById('btn-cancel');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('form-surat').reset();
      document.getElementById('surat-tipe').value = currentTab;
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
  document.getElementById('form-surat').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addSurat();
  });
}

// ============================================
// Update Drive Link
// ============================================
function updateDriveLink() {
  const driveLinkEl = document.getElementById('drive-archive-link');
  if (driveLinkEl) {
    driveLinkEl.href = DRIVE_LINKS[currentTab];
    driveLinkEl.textContent = `📁 Arsip Drive Surat ${currentTab === 'masuk' ? 'Masuk' : 'Keluar'}`;
  }
}

// ============================================
// Load Surat
// ============================================
async function loadSurat() {
  const tableBody = document.getElementById('surat-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;"><div class="spinner"></div></td></tr>';

  try {
    const snapshot = await getDocs(collection(db, 'surat'));

    // Filter by tipe client-side and sort by createdAt desc
    const docs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.tipe === currentTab)
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

    if (docs.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <div class="empty-icon">${currentTab === 'masuk' ? '📥' : '📤'}</div>
            <p>Belum ada surat ${currentTab}</p>
          </div>
        </td></tr>`;
      return;
    }

    const isAdmin = getUserRole() === 'admin';

    tableBody.innerHTML = docs.map((d, index) => {
      return `
        <tr style="animation: fadeInUp ${0.1 + index * 0.05}s ease-out">
          <td><span class="badge ${d.tipe}">${escapeHtml(d.nomorSurat)}</span></td>
          <td style="color:var(--text-primary);font-weight:500;">${escapeHtml(d.namaKegiatan)}</td>
          <td>${escapeHtml(d.tujuan) || '-'}</td>
          <td>${escapeHtml(d.lampiran) || '-'}</td>
          <td class="link-cell">
            ${d.linkSurat ? `<a href="${escapeHtml(d.linkSurat)}" target="_blank">Buka Surat ↗</a>` : '-'}
          </td>
          <td>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteSurat('${d.id}')">Hapus</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  } catch (error) {
    console.error('Error loading surat:', error);
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--danger);">Gagal memuat data. Periksa koneksi dan konfigurasi Firebase.</td></tr>';
  }
}

// ============================================
// Add Surat
// ============================================
async function addSurat() {
  const namaKegiatan = document.getElementById('surat-nama').value.trim();
  const nomorSurat = document.getElementById('surat-nomor').value.trim();
  const tipe = document.getElementById('surat-tipe').value;
  const tujuan = document.getElementById('surat-tujuan').value.trim();
  const lampiran = document.getElementById('surat-lampiran').value.trim();
  const linkSurat = document.getElementById('surat-link').value.trim();

  if (!namaKegiatan || !nomorSurat) {
    showToast('Lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'surat'), {
      namaKegiatan,
      nomorSurat,
      tipe,
      tujuan,
      lampiran,
      linkSurat,
      createdAt: serverTimestamp()
    });

    document.getElementById('modal-surat').classList.remove('active');
    showToast('Surat berhasil ditambahkan', 'success');
    await loadSurat();
  } catch (error) {
    console.error('Error adding surat:', error);
    showToast('Gagal menambahkan surat', 'error');
  }
}

// ============================================
// Delete Surat
// ============================================
async function deleteSuratFn(id) {
  if (!confirm('Yakin ingin menghapus surat ini?')) return;

  try {
    await deleteDoc(doc(db, 'surat', id));
    showToast('Surat berhasil dihapus', 'success');
    await loadSurat();
  } catch (error) {
    console.error('Error deleting surat:', error);
    showToast('Gagal menghapus surat', 'error');
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

// Expose to global scope
window.deleteSurat = deleteSuratFn;

// Initialize
init();
