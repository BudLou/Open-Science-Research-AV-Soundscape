import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBz3MXCD2wzszCsM_3KatX4cVpgY5NOUqk",
  authDomain: "soundscape-1bfaa.firebaseapp.com",
  projectId: "soundscape-1bfaa",
  storageBucket: "soundscape-1bfaa.firebasestorage.app",
  messagingSenderId: "648446442123",
  appId: "1:648446442123:web:78f15a9bf9f610e3ddf28e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
