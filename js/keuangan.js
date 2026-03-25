// ============================================
// Keuangan & Kas Module
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

  initSidebar('keuangan');
  applyRoleAccess();
  setupEventListeners();
  await loadTransaksi();
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  const modal = document.getElementById('modal-transaksi');
  const btnAdd = document.getElementById('btn-add-transaksi');
  const btnCancel = document.getElementById('btn-cancel');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('form-transaksi').reset();
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

  // Format nominal input
  const nominalInput = document.getElementById('transaksi-nominal');
  if (nominalInput) {
    nominalInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      e.target.value = val;
    });
  }

  // Form submit
  document.getElementById('form-transaksi').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addTransaksi();
  });
}

// ============================================
// Load Transaksi
// ============================================
async function loadTransaksi() {
  const tableBody = document.getElementById('transaksi-table-body');
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;"><div class="spinner"></div></td></tr>';

  try {
    const snapshot = await getDocs(collection(db, 'transaksi'));

    // Sort client-side by createdAt desc
    const docs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    const rows = [];
    const isAdmin = getUserRole() === 'admin';

    docs.forEach((d, index) => {
      const nominal = Number(d.nominal) || 0;

      if (d.jenis === 'pemasukan') totalPemasukan += nominal;
      else totalPengeluaran += nominal;

      rows.push(`
        <tr style="animation: fadeInUp ${0.1 + index * 0.05}s ease-out">
          <td>${index + 1}</td>
          <td style="color:var(--text-primary);font-weight:500;">${escapeHtml(d.keterangan)}</td>
          <td><span class="badge ${d.jenis}">${d.jenis === 'pemasukan' ? '↑ Pemasukan' : '↓ Pengeluaran'}</span></td>
          <td style="font-weight:600;color:${d.jenis === 'pemasukan' ? 'var(--success)' : 'var(--danger)'}">
            ${d.jenis === 'pemasukan' ? '+' : '-'}${formatRupiah(nominal)}
          </td>
          <td>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteTransaksi('${d.id}')">Hapus</button>` : ''}
          </td>
        </tr>`);
    });

    // Update kas display
    const totalKas = totalPemasukan - totalPengeluaran;
    document.getElementById('total-kas').textContent = formatRupiah(totalKas);
    document.getElementById('total-pemasukan').textContent = '+' + formatRupiah(totalPemasukan);
    document.getElementById('total-pengeluaran').textContent = '-' + formatRupiah(totalPengeluaran);

    if (rows.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <div class="empty-icon">💰</div>
            <p>Belum ada transaksi</p>
          </div>
        </td></tr>`;
    } else {
      tableBody.innerHTML = rows.join('');
    }
  } catch (error) {
    console.error('Error loading transaksi:', error);
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--danger);">Gagal memuat data</td></tr>';
  }
}

// ============================================
// Add Transaksi
// ============================================
async function addTransaksi() {
  const keterangan = document.getElementById('transaksi-keterangan').value.trim();
  const jenis = document.getElementById('transaksi-jenis').value;
  const nominal = document.getElementById('transaksi-nominal').value.trim();

  if (!keterangan || !nominal) {
    showToast('Lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'transaksi'), {
      keterangan,
      jenis,
      nominal: parseInt(nominal),
      createdAt: serverTimestamp()
    });

    document.getElementById('modal-transaksi').classList.remove('active');
    showToast('Transaksi berhasil ditambahkan', 'success');
    await loadTransaksi();
  } catch (error) {
    console.error('Error adding transaksi:', error);
    showToast('Gagal menambahkan transaksi', 'error');
  }
}

// ============================================
// Delete Transaksi
// ============================================
async function deleteTransaksiFn(id) {
  if (!confirm('Yakin ingin menghapus transaksi ini?')) return;

  try {
    await deleteDoc(doc(db, 'transaksi', id));
    showToast('Transaksi berhasil dihapus', 'success');
    await loadTransaksi();
  } catch (error) {
    console.error('Error deleting transaksi:', error);
    showToast('Gagal menghapus transaksi', 'error');
  }
}

// ============================================
// Utilities
// ============================================
function formatRupiah(num) {
  return 'Rp ' + Math.abs(num).toLocaleString('id-ID');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expose to global
window.deleteTransaksi = deleteTransaksiFn;

// Initialize
init();
