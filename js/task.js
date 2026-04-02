// ============================================
// Task Module
// ============================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { checkAuth, applyRoleAccess, initSidebar, getUserRole, showToast } from './auth.js';

let currentFilter = 'semua';
let notificationPermission = 'default';

// ============================================
// Initialize
// ============================================
async function init() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  initSidebar('task');
  applyRoleAccess();
  setupEventListeners();
  await requestNotificationPermission();
  await loadTasks();
  startTaskChecker();
}

// ============================================
// Browser Notification Permission
// ============================================
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
  } else if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      notificationPermission = permission;
    } catch (e) {
      console.error('Notification permission error:', e);
    }
  }
}

function sendNotification(title, body) {
  if (notificationPermission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body,
      icon: 'assets/logo.png',
      badge: 'assets/logo.png',
      tag: 'webnal-task-' + Date.now(),
      requireInteraction: true
    });
    notification.onclick = () => { window.focus(); notification.close(); };
    setTimeout(() => notification.close(), 10000);
  } catch (e) { /* silent */ }
}

// ============================================
// Task Deadline Checker - runs every 60s
// ============================================
function startTaskChecker() {
  checkUpcomingTasks();
  setInterval(checkUpcomingTasks, 60000);
}

async function checkUpcomingTasks() {
  try {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const now = new Date();

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      if (data.selesai) return;

      const deadline = new Date(`${data.tanggal}T${data.jam}`);
      const diffMs = deadline - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes > 0 && diffMinutes <= 30) {
        const key = `notified_task_${docSnap.id}_30`;
        if (!sessionStorage.getItem(key)) {
          sendNotification('⏰ Deadline Mendekati!', `"${data.judul}" dalam ${diffMinutes} menit lagi!`);
          sessionStorage.setItem(key, 'true');
        }
      }

      if (diffMinutes > 0 && diffMinutes <= 5) {
        const key = `notified_task_${docSnap.id}_5`;
        if (!sessionStorage.getItem(key)) {
          sendNotification('🔴 Deadline Segera!', `"${data.judul}" dalam ${diffMinutes} menit lagi!`);
          sessionStorage.setItem(key, 'true');
        }
      }

      if (diffMinutes < 0 && diffMinutes >= -2) {
        const key = `notified_task_${docSnap.id}_passed`;
        if (!sessionStorage.getItem(key)) {
          sendNotification('⚠️ Task Terlewat!', `"${data.judul}" sudah melewati deadline!`);
          sessionStorage.setItem(key, 'true');
        }
      }
    });
  } catch (e) { /* silent */ }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadTasks();
    });
  });

  // Add Task modal
  const modalTask = document.getElementById('modal-task');
  const btnAdd = document.getElementById('btn-add-task');
  const btnCancelTask = document.getElementById('btn-cancel-task');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      document.getElementById('form-task').reset();
      modalTask.classList.add('active');
    });
  }

  if (btnCancelTask) {
    btnCancelTask.addEventListener('click', () => modalTask.classList.remove('active'));
  }

  modalTask.addEventListener('click', (e) => {
    if (e.target === modalTask) modalTask.classList.remove('active');
  });

  // Add Output modal
  const modalOutput = document.getElementById('modal-output');
  const btnCancelOutput = document.getElementById('btn-cancel-output');

  if (btnCancelOutput) {
    btnCancelOutput.addEventListener('click', () => modalOutput.classList.remove('active'));
  }

  modalOutput.addEventListener('click', (e) => {
    if (e.target === modalOutput) modalOutput.classList.remove('active');
  });

  // Form submits
  document.getElementById('form-task').addEventListener('submit', async (e) => {
    e.preventDefault();
    await addTask();
  });

  document.getElementById('form-output').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveOutput();
  });
}

// ============================================
// Load Tasks
// ============================================
async function loadTasks() {
  const container = document.getElementById('task-container');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:32px;"><div class="spinner"></div></div>';

  try {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const now = new Date();
    const nowTime = now.getTime();

    let docs = snapshot.docs.map(d => {
      const data = d.data();
      const deadlineDate = new Date(`${data.tanggal}T${data.jam}`);
      const isPast = deadlineDate.getTime() < nowTime;

      let status = 'aktif';
      if (data.selesai) {
        status = 'selesai';
      } else if (isPast) {
        status = 'terlewat';
      }

      return { id: d.id, ...data, status, deadlineMs: deadlineDate.getTime() };
    });

    // Apply filter
    if (currentFilter !== 'semua') {
      docs = docs.filter(d => d.status === currentFilter);
    }

    // Sort: aktif (asc deadline), terlewat (desc), selesai (desc)
    docs.sort((a, b) => {
      const order = { aktif: 0, terlewat: 1, selesai: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      if (a.status === 'aktif') return a.deadlineMs - b.deadlineMs;
      return b.deadlineMs - a.deadlineMs;
    });

    if (docs.length === 0) {
      const filterText = currentFilter === 'semua' ? '' : ` berstatus "${currentFilter}"`;
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-icon">✅</div>
          <p>Tidak ada task${filterText}</p>
        </div>`;
      return;
    }

    const isAdmin = getUserRole() === 'admin';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    container.innerHTML = docs.map((d, index) => {
      const date = new Date(`${d.tanggal}T${d.jam}`);
      const dayName = days[date.getDay()];
      const formattedDate = `${dayName}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

      // Countdown for active tasks
      let countdownText = '';
      if (d.status === 'aktif') {
        const diffMs = d.deadlineMs - nowTime;
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) {
          countdownText = `${diffDays} hari ${diffHours % 24} jam lagi`;
        } else if (diffHours > 0) {
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          countdownText = `${diffHours} jam ${diffMins} menit lagi`;
        } else {
          const diffMins = Math.floor(diffMs / 60000);
          countdownText = `${Math.max(0, diffMins)} menit lagi`;
        }
      }

      const statusConfig = {
        aktif: { icon: '🔔', label: 'Aktif', class: 'aktif' },
        selesai: { icon: '✅', label: 'Selesai', class: 'selesai' },
        terlewat: { icon: '⚠️', label: 'Terlewat', class: 'terlewat' }
      };
      const sc = statusConfig[d.status];

      // Output section
      let outputHtml = '';
      if (d.output) {
        outputHtml = `
          <div class="task-output">
            <div class="task-output-label">📄 Output</div>
            <div class="task-output-content">${escapeHtml(d.output)}</div>
            ${d.outputLink ? `<a href="${escapeHtml(d.outputLink)}" target="_blank" class="task-output-link">📎 Lihat Dokumen ↗</a>` : ''}
          </div>`;
      }

      return `
        <div class="reminder-card ${d.status}" style="animation: fadeInUp ${0.15 + index * 0.08}s ease-out">
          <div class="reminder-card-header">
            <div class="reminder-status-badge ${sc.class}">${sc.icon} ${sc.label}</div>
            ${d.status === 'aktif' && countdownText ? `<div class="reminder-countdown">${countdownText}</div>` : ''}
          </div>
          <h3 class="reminder-title">${escapeHtml(d.judul)}</h3>
          <div class="reminder-meta">
            <span><span class="icon">📅</span> ${formattedDate}</span>
            <span><span class="icon">🕐</span> ${d.jam}</span>
          </div>
          ${d.deskripsi ? `<p class="reminder-desc">${escapeHtml(d.deskripsi)}</p>` : ''}
          ${outputHtml}
          <div class="reminder-actions">
            ${d.status !== 'selesai' ? `
              <button class="btn-complete" onclick="toggleTask('${d.id}', true)">
                ✅ Tandai Selesai
              </button>
            ` : `
              <button class="btn-reopen" onclick="toggleTask('${d.id}', false)">
                🔄 Buka Kembali
              </button>
            `}
            <button class="btn-output" onclick="openOutputModal('${d.id}', '${escapeAttr(d.judul)}', '${escapeAttr(d.output || '')}', '${escapeAttr(d.outputLink || '')}')">
              📄 ${d.output ? 'Edit Output' : 'Tambah Output'}
            </button>
            ${isAdmin ? `<button class="btn-danger" onclick="deleteTask('${d.id}')">Hapus</button>` : ''}
          </div>
        </div>`;
    }).join('');
  } catch (error) {
    console.error('Error loading tasks:', error);
    container.innerHTML = '<div style="text-align:center;color:var(--danger);padding:32px;">Gagal memuat data task</div>';
  }
}

// ============================================
// Add Task (Admin only)
// ============================================
async function addTask() {
  const judul = document.getElementById('task-judul').value.trim();
  const tanggal = document.getElementById('task-tanggal').value;
  const jam = document.getElementById('task-jam').value;
  const deskripsi = document.getElementById('task-deskripsi').value.trim();

  if (!judul || !tanggal || !jam) {
    showToast('Lengkapi semua field yang wajib diisi', 'error');
    return;
  }

  try {
    await addDoc(collection(db, 'tasks'), {
      judul,
      tanggal,
      jam,
      deskripsi,
      output: '',
      outputLink: '',
      selesai: false,
      createdAt: serverTimestamp()
    });

    document.getElementById('modal-task').classList.remove('active');
    showToast('Task berhasil ditambahkan', 'success');
    await loadTasks();
  } catch (error) {
    console.error('Error adding task:', error);
    showToast('Gagal menambahkan task', 'error');
  }
}

// ============================================
// Toggle Task Status (Admin & Anggota)
// ============================================
async function toggleTaskFn(id, selesai) {
  try {
    await updateDoc(doc(db, 'tasks', id), { selesai });
    showToast(selesai ? 'Task ditandai selesai' : 'Task dibuka kembali', 'success');
    await loadTasks();
  } catch (error) {
    console.error('Error updating task:', error);
    showToast('Gagal mengubah status task', 'error');
  }
}

// ============================================
// Output Modal
// ============================================
function openOutputModalFn(id, judul, existingOutput, existingLink) {
  document.getElementById('output-task-id').value = id;
  document.getElementById('output-task-title').textContent = judul;
  document.getElementById('output-isi').value = existingOutput;
  document.getElementById('output-link').value = existingLink;
  document.getElementById('modal-output').classList.add('active');
}

async function saveOutput() {
  const taskId = document.getElementById('output-task-id').value;
  const output = document.getElementById('output-isi').value.trim();
  const outputLink = document.getElementById('output-link').value.trim();

  if (!output) {
    showToast('Output tidak boleh kosong', 'error');
    return;
  }

  try {
    await updateDoc(doc(db, 'tasks', taskId), { output, outputLink });
    document.getElementById('modal-output').classList.remove('active');
    showToast('Output berhasil disimpan', 'success');
    await loadTasks();
  } catch (error) {
    console.error('Error saving output:', error);
    showToast('Gagal menyimpan output', 'error');
  }
}

// ============================================
// Delete Task (Admin only)
// ============================================
async function deleteTaskFn(id) {
  if (!confirm('Yakin ingin menghapus task ini?')) return;

  try {
    await deleteDoc(doc(db, 'tasks', id));
    showToast('Task berhasil dihapus', 'success');
    await loadTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
    showToast('Gagal menghapus task', 'error');
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

function escapeAttr(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// Expose to global scope
window.deleteTask = deleteTaskFn;
window.toggleTask = toggleTaskFn;
window.openOutputModal = openOutputModalFn;

// Initialize
init();
