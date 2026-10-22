import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAFMVGvDO9SyCQWTMzcyqP-HXW-mlnVN2E",
    authDomain: "reservation-13d04.firebaseapp.com",
    projectId: "reservation-13d04",
    storageBucket: "reservation-13d04.firebasestorage.app",
    messagingSenderId: "199131497639",
    appId: "1:199131497639:web:403e5f2c5eda44d8914782"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const submitBtn = document.querySelector(".signup-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // UI Loading State
        submitBtn.disabled = true;
        submitBtn.innerText = "Creating Account...";

        const name = document.getElementById("fullName").value;
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = document.getElementById("regRole").value; // "Doctor" or "Patient"

        try {
            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save User Profile to Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString()
            });

            alert(`Welcome, ${name}! Your ${role} account is ready.`);
            window.location.replace("login.html");

        } catch (error) {
            console.error("Signup Error:", error);
            alert("Signup Failed: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Create Account";
        }
    });
});