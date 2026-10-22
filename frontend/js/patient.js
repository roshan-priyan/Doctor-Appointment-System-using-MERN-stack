import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAFMVGvDO9SyCQWTMzcyqP-HXW-mlnVN2E",
    authDomain: "reservation-13d04.firebaseapp.com",
    projectId: "reservation-13d04",
    storageBucket: "reservation-13d04.firebasestorage.app",
    messagingSenderId: "199131497639",
    appId: "1:199131497639:web:403e5f2c5eda44d8914782"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- STATE MANAGEMENT ---
const userId = localStorage.getItem("userId");
let cachedName = localStorage.getItem("userName") || "Patient";
let selectedDoctorId = null;
let selectedSlot = null;
let currentPayingAppId = null;

// --- INITIALIZATION ---
async function initDashboard() {
    if (!userId) { 
        window.location.href = "login.html"; 
        return; 
    }
    
    document.getElementById("patientNameDisplay").innerText = cachedName;

    try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
            const data = userSnap.data();
            // Load Profile Fields
            document.getElementById("nameInput").value = data.name || "";
            document.getElementById("emailInput").value = data.email || "";
            document.getElementById("p-blood").value = data.bloodGroup || "";
            document.getElementById("p-age").value = data.age || "";
            document.getElementById("p-height").value = data.height || "";
            document.getElementById("p-weight").value = data.weight || "";
            document.getElementById("p-disease").value = data.disease || "";
            
            cachedName = data.name || "Patient";
            document.getElementById("patientNameDisplay").innerText = cachedName;
        }
        loadAvailableDoctors();
        loadPatientAppointments();
    } catch (error) { 
        console.error("Initialization Error:", error); 
    }
}

// --- DOCTOR LISTING ---
async function loadAvailableDoctors() {
    const container = document.getElementById("doctorList");
    const q = query(collection(db, "users"), where("role", "==", "Doctor"));
    const snapshot = await getDocs(q);
    
    container.innerHTML = "";
    snapshot.forEach(docSnap => {
        const d = docSnap.data();
        container.innerHTML += `
            <div class="stat-box" style="border-left: 4px solid var(--primary); text-align: left;">
                <h4 style="margin: 0;">Dr. ${d.name}</h4>
                <p style="color:var(--primary); font-size:0.85rem; margin: 5px 0;">${d.specialty || 'General Physician'}</p>
                <p style="color:#94a3b8; font-size:0.8rem;">Fee: ₹${d.fees || '500'}</p>
                <button onclick="openBookingModal('${docSnap.id}', '${d.name}')" style="width:100%; margin-top:10px;">Book Now</button>
            </div>`;
    });
}

// --- BOOKING LOGIC ---
window.openBookingModal = function(id, name) {
    selectedDoctorId = id;
    selectedSlot = null;
    document.getElementById("modalDrName").innerText = "Book with Dr. " + name;
    document.getElementById("bookingModal").style.display = "flex";
    document.getElementById("confirmBookingBtn").disabled = true;
    loadDoctorSlots();
};

window.loadDoctorSlots = async function() {
    const day = document.getElementById("appointmentDay").value;
    const grid = document.getElementById("slotsGrid");
    grid.innerHTML = "Loading...";
    
    const docSnap = await getDoc(doc(db, "doctors", selectedDoctorId));
    grid.innerHTML = "";
    
    if (docSnap.exists() && docSnap.data().availability?.[day]) {
        const slots = docSnap.data().availability[day];
        slots.forEach(time => {
            const btn = document.createElement("button");
            btn.innerText = time;
            btn.style = "padding:8px; background:rgba(255,255,255,0.05); border:1px solid var(--border); color:white; cursor:pointer;";
            btn.onclick = () => {
                document.querySelectorAll('#slotsGrid button').forEach(b => b.style.background = "rgba(255,255,255,0.05)");
                btn.style.background = "var(--primary)";
                selectedSlot = time;
                document.getElementById("confirmBookingBtn").disabled = false;
            };
            grid.appendChild(btn);
        });
    } else { 
        grid.innerHTML = "<p style='grid-column: 1/-1; color:#94a3b8;'>No slots available for this day.</p>"; 
    }
};

window.confirmBooking = async function() {
    const daySelect = document.getElementById("appointmentDay");
    const dayName = daySelect.options[daySelect.selectedIndex].text;
    
    try {
        await addDoc(collection(db, "appointments"), {
            doctorId: selectedDoctorId,
            patientId: userId,
            patientName: cachedName,
            time: selectedSlot,
            date: dayName,
            status: "pending",
            paymentStatus: "unpaid",
            createdAt: new Date()
        });
        alert("Booking request sent successfully!");
        document.getElementById("bookingModal").style.display = "none";
        loadPatientAppointments();
    } catch (e) { 
        alert("Booking Error: " + e.message); 
    }
};

// --- APPOINTMENT LIST WITH PRESCRIPTION & PAYMENT ---
async function loadPatientAppointments() {
    const container = document.getElementById("appointmentList");
    const q = query(collection(db, "appointments"), where("patientId", "==", userId));
    const snap = await getDocs(q);
    
    let total = 0;
    let upcoming = 0;
    container.innerHTML = "";

    if (snap.empty) {
        container.innerHTML = "<p style='color:#94a3b8; padding: 20px;'>No appointments found.</p>";
    }

    snap.forEach(docSnap => {
        const app = docSnap.data();
        total++;
        if(app.status === "confirmed") upcoming++;

        // 1. Payment Button Logic
        let paymentActionHtml = "";
        if (app.paymentStatus === 'paid') {
            paymentActionHtml = `
                <div style="width: 100%; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--accent); border-radius: 8px; color: var(--accent); font-weight: bold; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.85rem;">
                    <i class="ri-checkbox-circle-fill"></i> PAID
                </div>`;
        } else {
            paymentActionHtml = `
                <button class="btn-pay-big" onclick="openPaymentCard('${app.doctorId}', '${docSnap.id}')">
                    <i class="ri-wallet-3-line"></i> PAY NOW
                </button>`;
        }

        // 2. Prescription Button Logic (Appears if doctor has updated it)
        let prescriptionHtml = "";
        if (app.prescription) {
            prescriptionHtml = `
                <button onclick="viewPrescription('${btoa(app.prescription)}')" 
                    style="width: 100%; margin-top: 8px; padding: 10px; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.8rem;">
                    <i class="ri-capsule-line"></i> VIEW PRESCRIPTION
                </button>`;
        }

        container.innerHTML += `
            <div class="appointment-item">
                <div>
                    <div style="font-weight:bold; color:white;">${app.date}</div>
                    <div style="font-size:0.8rem; color:#94a3b8;">${app.time}</div>
                </div>
                <div>
                    <span class="badge-${app.status}">${app.status.toUpperCase()}</span>
                </div>
                <div>
                    ${paymentActionHtml}
                    ${prescriptionHtml}
                </div>
            </div>`;
    });

    document.getElementById("statTotal").innerText = total;
    document.getElementById("statUpcoming").innerText = upcoming;
}

// --- PRESCRIPTION VIEWER ---
window.viewPrescription = function(encodedData) {
    const text = atob(encodedData);
    document.getElementById("prescriptionText").innerText = text;
    document.getElementById("viewPrescriptionModal").style.display = "flex";
};

window.closePrescriptionModal = function() {
    document.getElementById("viewPrescriptionModal").style.display = "none";
};

// --- STATIC FEE PAYMENT SYSTEM ---
window.openPaymentCard = async function(doctorId, appointmentId) {
    try {
        const docRef = doc(db, "users", doctorId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const drData = docSnap.data();
            const staticFee = drData.fees || "500"; 
            
            document.getElementById("payDrName").innerText = "Dr. " + drData.name;
            document.getElementById("payAmountDisplay").innerText = staticFee;
            
            currentPayingAppId = appointmentId;
            document.getElementById("paymentModal").style.display = "flex";
        } else {
            alert("Could not retrieve doctor's fee information.");
        }
    } catch (e) {
        console.error("Payment Card Error:", e);
    }
};

window.processPayment = function() {
    const amount = document.getElementById("payAmountDisplay").innerText;
    const payBtn = event.target;
    
    payBtn.innerText = "Processing...";
    payBtn.disabled = true;

    // Simulate Gateway delay
    setTimeout(async () => {
        try {
            await updateDoc(doc(db, "appointments", currentPayingAppId), {
                paymentStatus: "paid"
            });

            alert(`Payment Successful!\nAmount: ₹${amount}\nTransaction ID: TXN-${Math.floor(Math.random()*1000000)}`);
            
            document.getElementById("paymentModal").style.display = "none";
            loadPatientAppointments(); 
        } catch (error) {
            alert("Error updating payment: " + error.message);
        } finally {
            payBtn.innerText = "CONFIRM & PAY";
            payBtn.disabled = false;
        }
    }, 2000);
};

// --- PROFILE SAVING ---
window.saveProfile = async function() {
    const data = {
        name: document.getElementById("nameInput").value,
        bloodGroup: document.getElementById("p-blood").value,
        age: document.getElementById("p-age").value,
        height: document.getElementById("p-height").value,
        weight: document.getElementById("p-weight").value,
        disease: document.getElementById("p-disease").value
    };
    
    try {
        await updateDoc(doc(db, "users", userId), data);
        localStorage.setItem("userName", data.name);
        cachedName = data.name;
        document.getElementById("patientNameDisplay").innerText = cachedName;
        alert("Profile updated successfully!");
    } catch (e) {
        alert("Save Error: " + e.message);
    }
};

// Start the Dashboard
initDashboard();