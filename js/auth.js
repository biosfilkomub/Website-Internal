// ============================================
// Authentication Module
// ============================================
import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// ============================================
// Login
// ============================================
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      sessionStorage.setItem('userRole', userData.role || 'anggota');
      sessionStorage.setItem('userName', userData.name || email);
      sessionStorage.setItem('userEmail', email);
    } else {
      // If no user doc exists, default to anggota
      sessionStorage.setItem('userRole', 'anggota');
      sessionStorage.setItem('userName', email);
      sessionStorage.setItem('userEmail', email);
    }

    return { success: true };
  } catch (error) {
    let message = 'Login gagal. Silakan coba lagi.';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'Email tidak ditemukan.';
        break;
      case 'auth/wrong-password':
        message = 'Password salah.';
        break;
      case 'auth/invalid-email':
        message = 'Format email tidak valid.';
        break;
      case 'auth/invalid-credential':
        message = 'Email atau password salah.';
        break;
      case 'auth/too-many-requests':
        message = 'Terlalu banyak percobaan. Coba lagi nanti.';
        break;
    }
    return { success: false, message };
  }
}

// ============================================
// Register
// ============================================
async function register(name, email, password, role = 'anggota') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });

    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userEmail', email);

    return { success: true };
  } catch (error) {
    let message = 'Registrasi gagal. Silakan coba lagi.';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Email sudah terdaftar.';
        break;
      case 'auth/weak-password':
        message = 'Password terlalu lemah (min. 6 karakter).';
        break;
      case 'auth/invalid-email':
        message = 'Format email tidak valid.';
        break;
    }
    return { success: false, message };
  }
}

// ============================================
// Logout
// ============================================
async function logout() {
  try {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// ============================================
// Auth Guard - check if user is logged in
// ============================================
function checkAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = 'index.html';
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// ============================================
// Get user role
// ============================================
function getUserRole() {
  return sessionStorage.getItem('userRole') || 'anggota';
}

function getUserName() {
  return sessionStorage.getItem('userName') || 'User';
}

function getUserEmail() {
  return sessionStorage.getItem('userEmail') || '';
}

// ============================================
// Apply role-based UI
// ============================================
function applyRoleAccess() {
  const role = getUserRole();
  if (role !== 'admin') {
    // Hide all admin-only elements
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// ============================================
// Initialize Sidebar (shared across pages)
// ============================================
function initSidebar(activePage) {
  const role = getUserRole();
  const name = getUserName();
  const initial = name.charAt(0).toUpperCase();

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div style="text-align:center;"><img src="assets/logo.png" alt="Logo" style="width:56px;height:56px;border-radius:50%;margin-bottom:8px;"></div>
      <div class="user-info">
        <div class="user-detail">
          <div class="name">${name}</div>
          <span class="role-badge ${role}">${role === 'admin' ? 'Admin' : 'Anggota'}</span>
        </div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-label">Menu</div>
      <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">
        <span class="nav-icon">📊</span> Dashboard
      </a>
      <a href="administrasi.html" class="${activePage === 'administrasi' ? 'active' : ''}">
        <span class="nav-icon">📄</span> Administrasi
      </a>
      <a href="keuangan.html" class="${activePage === 'keuangan' ? 'active' : ''}">
        <span class="nav-icon">💰</span> Keuangan & Kas
      </a>
      <a href="timeline.html" class="${activePage === 'timeline' ? 'active' : ''}">
        <span class="nav-icon">📅</span> Timeline Acara
      </a>
      <a href="notulensi.html" class="${activePage === 'notulensi' ? 'active' : ''}">
        <span class="nav-icon">📝</span> Notulensi
      </a>
      <a href="task.html" class="${activePage === 'task' ? 'active' : ''}">
        <span class="nav-icon">✅</span> Task
      </a>
    </nav>
    <div class="sidebar-footer">
      <button class="btn-logout" id="btn-logout">
        🚪 Keluar
      </button>
    </div>
  `;

  // Logout handler
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Mobile toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileOverlay = document.querySelector('.mobile-overlay');

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      mobileOverlay.classList.toggle('active');
    });
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      mobileOverlay.classList.remove('active');
    });
  }
}

// ============================================
// Toast Notification
// ============================================
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export {
  login,
  register,
  logout,
  checkAuth,
  getUserRole,
  getUserName,
  getUserEmail,
  applyRoleAccess,
  initSidebar,
  showToast
};
