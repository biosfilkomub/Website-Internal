// ============================================
// Firebase Configuration
// Replace with your own Firebase config
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// TODO: Replace this config with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAzXo6W2EC_nJWbZgRdOsldDrj7BPrPBC0",
  authDomain: "webnal-e9936.firebaseapp.com",
  projectId: "webnal-e9936",
  storageBucket: "webnal-e9936.firebasestorage.app",
  messagingSenderId: "684172832593",
  appId: "1:684172832593:web:c3d107931a30b1f6166d70",
  measurementId: "G-GFV30RB2G8"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
