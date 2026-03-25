// ============================================
// Dashboard Module
// ============================================
import { db } from './firebase-config.js';
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { checkAuth, applyRoleAccess, initSidebar, getUserRole } from './auth.js';

// ============================================
// Calendar State
// ============================================
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allEvents = [];

// ============================================
// Initialize Dashboard
// ============================================
async function init() {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  initSidebar('dashboard');
  applyRoleAccess();

  await loadAllData();
}

async function loadAllData() {
  await Promise.all([
    loadStats(),
    loadEvents(),
  ]);
  renderCalendar();
  renderUpcomingEvents();
}

// ============================================
// Load Stats
// ============================================
async function loadStats() {
  try {
    // Count surat
    const suratSnap = await getDocs(collection(db, 'surat'));
    const suratMasuk = suratSnap.docs.filter(d => d.data().tipe === 'masuk').length;
    const suratKeluar = suratSnap.docs.filter(d => d.data().tipe === 'keluar').length;

    document.getElementById('stat-surat-masuk').textContent = suratMasuk;
    document.getElementById('stat-surat-keluar').textContent = suratKeluar;

    // Calculate kas
    const transaksiSnap = await getDocs(collection(db, 'transaksi'));
    let totalKas = 0;
    transaksiSnap.forEach(doc => {
      const d = doc.data();
      if (d.jenis === 'pemasukan') totalKas += Number(d.nominal) || 0;
      else totalKas -= Number(d.nominal) || 0;
    });
    document.getElementById('stat-kas').textContent = formatRupiah(totalKas);

    // Count upcoming events
    const today = new Date().toISOString().split('T')[0];
    const acaraSnap = await getDocs(collection(db, 'acara'));
    const upcoming = acaraSnap.docs.filter(d => d.data().tanggal >= today).length;
    document.getElementById('stat-acara').textContent = upcoming;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ============================================
// Load Events for Calendar
// ============================================
async function loadEvents() {
  try {
    const acaraSnap = await getDocs(collection(db, 'acara'));
    allEvents = acaraSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  } catch (error) {
    console.error('Error loading events:', error);
    allEvents = [];
  }
}

// ============================================
// Render Calendar
// ============================================
function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('month-label');
  if (!calendarGrid || !monthLabel) return;

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  monthLabel.textContent = `${months[currentMonth]} ${currentYear}`;

  // Day headers
  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  let html = dayHeaders.map(d => `<div class="day-header">${d}</div>`).join('');

  // First day of month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="day-cell other-month">${daysInPrevMonth - i}</div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const hasEvent = allEvents.some(e => e.tanggal === dateStr);

    let classes = 'day-cell';
    if (isToday) classes += ' today';
    if (hasEvent && !isToday) classes += ' has-event';

    html += `<div class="${classes}">${day}</div>`;
  }

  // Next month days
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="day-cell other-month">${i}</div>`;
  }

  calendarGrid.innerHTML = html;
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
}

// ============================================
// Render Upcoming Events
// ============================================
function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];
  const upcoming = allEvents
    .filter(e => e.tanggal >= today)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <p>Tidak ada acara mendatang</p>
      </div>`;
    return;
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  container.innerHTML = upcoming.map(event => {
    const date = new Date(event.tanggal + 'T00:00:00');
    const day = date.getDate();
    const month = months[date.getMonth()];

    return `
      <div class="upcoming-item">
        <div class="date-box">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="event-info">
          <div class="name">${escapeHtml(event.namaKegiatan)}</div>
          <div class="detail">📍 ${escapeHtml(event.lokasi)} • 🕐 ${escapeHtml(event.jam)}</div>
        </div>
      </div>`;
  }).join('');
}

// ============================================
// Utilities
// ============================================
function formatRupiah(num) {
  const prefix = num < 0 ? '-Rp ' : 'Rp ';
  return prefix + Math.abs(num).toLocaleString('id-ID');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// Expose to global scope for HTML onclick
// ============================================
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;

// Initialize
init();
