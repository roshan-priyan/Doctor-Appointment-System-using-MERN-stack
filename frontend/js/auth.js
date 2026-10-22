import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// Firebase Configuration (Must match signup.js)
const firebaseConfig = {
    apiKey: "AIzaSyAFMVGvDO9SyCQWTMzcyqP-HXW-mlnVN2E",
    authDomain: "reservation-13d04.firebaseapp.com",
    projectId: "reservation-13d04",
    storageBucket: "reservation-13d04.firebasestorage.app",
    messagingSenderId: "199131497639",
    appId: "1:199131497639:web:403e5f2c5eda44d8914782"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // UI Loading State
        submitBtn.disabled = true;
        btnText.innerText = "Authenticating...";
        btnSpinner.style.display = "block";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("userRole").value; // "Doctor" or "Patient"

        try {
            // 1. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Fetch User Role from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const dbRole = userData.role;

                // 3. Validate Role Selection
                if (dbRole.toLowerCase() !== selectedRole.toLowerCase()) {
                    alert(`Access Denied: You are registered as a ${dbRole}, not a ${selectedRole}.`);
                    await signOut(auth);
                    resetButton();
                    return;
                }

                // 4. Success: Store session and redirect
                localStorage.setItem("userId", user.uid);
                localStorage.setItem("userName", userData.name);
                localStorage.setItem("userRole", dbRole);

                if (dbRole === "Doctor") {
                    window.location.href = "doctor-dashboard.html";
                } else {
                    window.location.href = "index.html"; // Patient Dashboard
                }

            } else {
                throw new Error("User profile not found in database.");
            }

        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Failed: " + error.message);
            resetButton();
        }
    });

    function resetButton() {
        submitBtn.disabled = false;
        btnText.innerText = "Sign In";
        btnSpinner.style.display = "none";
    }
});