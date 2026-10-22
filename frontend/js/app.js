// 🔹 Firebase configuration


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFMVGvDO9SyCQWTMzcyqP-HXW-mlnVN2E",
  authDomain: "reservation-13d04.firebaseapp.com",
  projectId: "reservation-13d04",
  storageBucket: "reservation-13d04.firebasestorage.app",
  messagingSenderId: "199131497639",
  appId: "1:199131497639:web:403e5f2c5eda44d8914782"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);