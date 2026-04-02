// ============================================
// Notulensi Module - Meeting Notes Only
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

  initSidebar('notulensi');
  applyRoleAccess();
  setupEventListeners();
  await loadNotulensi();
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  const modal = document.getElementById('modal-notulensi');
  const btnAdd = document.getElementById('btn-add-notulensi');
  const btnCancel = document.getElementById('btn-cancel-notulensi');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('form-notulensi').reset();
      modal.classList.add('active');
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  document.getElementById('form-notulensi').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addNotulensi();
  });
}

// ============================================
// Load Notulensi
// ============================================
async function loadNotulensi() {
  const tableBody = document.getElementById('notulensi-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;"><div class="spinner"></div></td></tr>';

  try {
    const snapshot = await getDocs(collection(db, 'notulensi'));

    const docs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

    if (docs.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>Belum ada notulensi rapat</p>
          </div>
        </td></tr>`;
      return;
    }

    const isAdmin = getUserRole() === 'admin';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    tableBody.innerHTML = docs.map((d, index) => {
      const date = d.tanggal ? new Date(d.tanggal + 'T00:00:00') : null;
      const formattedDate = date
        ? `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
        : '-';

      const isiTruncated = d.isi && d.isi.length > 80
        ? d.isi.substring(0, 80) + '...'
        : (d.isi || '-');

      return `
        <tr style="animation: fadeInUp ${0.1 + index * 0.05}s ease-out">
          <td>${index + 1}</td>
          <td style="color:var(--text-primary);font-weight:600;">${escapeHtml(d.judul)}</td>
          <td><span class="badge masuk">${formattedDate}</span></td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(d.peserta || '-')}</td>
          <td>
            <div class="notulen-preview" title="${escapeHtml(d.isi || '')}">${escapeHtml(isiTruncated)}</div>
          </td>
          <td class="link-cell">
            ${d.link ? `<a href="${escapeHtml(d.link)}" target="_blank">Buka Dokumen ↗</a>` : '-'}
          </td>
          <td>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteNotulensi('${d.id}')">Hapus</button>` : ''}
          </td>
        </tr>`;
    }).join('');
  } catch (error) {
    console.error('Error loading notulensi:', error);
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--danger);">Gagal memuat data notulensi</td></tr>';
  }
}

// ============================================
// Add Notulensi
// ============================================
async function addNotulensi() {
  const judul = document.getElementById('notulensi-judul').value.trim();
  const tanggal = document.getElementById('notulensi-tanggal').value;
  const peserta = document.getElementById('notulensi-peserta').value.trim();
  const isi = document.getElementById('notulensi-isi').value.trim();
  const link = document.getElementById('notulensi-link').value.trim();

  if (!judul || !tanggal || !isi) {
    showToast('Lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'notulensi'), {
      judul,
      tanggal,
      peserta,
      isi,
      link,
      createdAt: serverTimestamp()
    });

    document.getElementById('modal-notulensi').classList.remove('active');
    showToast('Notulensi berhasil ditambahkan', 'success');
    await loadNotulensi();
  } catch (error) {
    console.error('Error adding notulensi:', error);
    showToast('Gagal menambahkan notulensi', 'error');
  }
}

// ============================================
// Delete Notulensi
// ============================================
async function deleteNotulensiFn(id) {
  if (!confirm('Yakin ingin menghapus notulensi ini?')) return;

  try {
    await deleteDoc(doc(db, 'notulensi', id));
    showToast('Notulensi berhasil dihapus', 'success');
    await loadNotulensi();
  } catch (error) {
    console.error('Error deleting notulensi:', error);
    showToast('Gagal menghapus notulensi', 'error');
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
window.deleteNotulensi = deleteNotulensiFn;

// Initialize
init();
