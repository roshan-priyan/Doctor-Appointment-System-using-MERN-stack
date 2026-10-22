import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
    getFirestore, collection, doc, getDocs, getDoc, 
    setDoc, updateDoc, query, where 
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
const currentDoctor = localStorage.getItem("userId");
let currentDay = 'mon';

const timeTemplates = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

// --- INITIALIZATION ---
window.loadDoctorInfo = async function() {
    if (!currentDoctor) { 
        window.location.href = 'login.html'; 
        return; 
    }
    try {
        const userSnap = await getDoc(doc(db, "users", currentDoctor));
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById("drDisplayName").innerText = data.name;
        }
        await refreshDashboard();
    } catch (e) { 
        console.error("Initialization Error:", e); 
    }
};

// --- NAVIGATION & TAB LOGIC ---
window.showTab = function(tab, el) {
    // 1. Update UI Links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    if (el) el.classList.add('active');

    // 2. Switch Tab Visibility
    const tabs = ['dashboardTab', 'scheduleTab', 'appointmentsTab', 'profileTab'];
    tabs.forEach(id => {
        const section = document.getElementById(id);
        if (section) section.style.display = (id === tab + 'Tab') ? 'block' : 'none';
    });

    // 3. Trigger Specific Tab Data Loading
    if (tab === 'dashboard') refreshDashboard();
    if (tab === 'schedule') loadSchedule();
    if (tab === 'appointments') loadAppointments("allAppointmentsList");
    if (tab === 'profile') fetchProfileData(); // This ensures fees load when clicking profile
};

// --- APPOINTMENTS & DASHBOARD ---
window.refreshDashboard = async function() {
    await loadAppointments("doctorAppList"); 
    await updateCounters();
};

async function updateCounters() {
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentDoctor));
    const snap = await getDocs(q);
    let pending = 0, confirmed = 0;
    snap.forEach(d => {
        const status = d.data().status;
        if(status === 'pending') pending++;
        if(status === 'confirmed') confirmed++;
    });
    document.getElementById("pendingCount").innerText = pending;
    document.getElementById("confirmedCount").innerText = confirmed;
}

window.loadAppointments = async function(containerId) {
    const listContainer = document.getElementById(containerId);
    if(!listContainer) return;
    listContainer.innerHTML = "<p>Loading...</p>";
    
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentDoctor));
    const snapshot = await getDocs(q);
    
    listContainer.innerHTML = "";
    if (snapshot.empty) { 
        listContainer.innerHTML = "<p style='color:#94a3b8;'>No appointments found.</p>"; 
        return; 
    }
    
    snapshot.forEach(docSnap => {
        const appData = docSnap.data();
        const isPaid = appData.paymentStatus === "paid"; // Check payment status

        const div = document.createElement("div");
        div.className = "appointment-item";
        div.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <strong>${appData.patientName || 'Patient'}</strong>
                    ${isPaid ? 
                        `<span style="color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; border: 1px solid rgba(16, 185, 129, 0.3);">
                            <i class="ri-checkbox-circle-fill"></i> PAID
                        </span>` : 
                        `<span style="color: #94a3b8; font-size: 0.7rem; border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px;">UNPAID</span>`
                    }
                </div>
                <small style="color: #94a3b8;">${appData.date} | ${appData.time}</small>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <select onchange="updateStatus('${docSnap.id}', this.value)" style="background:#1e293b; color:white; border:1px solid var(--border); border-radius:5px; padding:5px;">
                    <option value="pending" ${appData.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${appData.status === 'confirmed' ? 'selected' : ''}>Confirm</option>
                    <option value="rejected" ${appData.status === 'rejected' ? 'selected' : ''}>Reject</option>
                </select>
                <span class="badge-${appData.status}">${appData.status.toUpperCase()}</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
};

window.updateStatus = async function(id, newStatus) {
    try {
        await updateDoc(doc(db, "appointments", id), { status: newStatus });
        refreshDashboard();
    } catch (e) { 
        alert("Update failed: " + e.message); 
    }
};

// --- PROFILE & STATIC FEE LOGIC ---

/**
 * Fetches the doctor's profile data (Specialty, Experience, and Fees)
 * from the 'users' collection.
 */
window.fetchProfileData = async function() {
    try {
        const docRef = doc(db, "users", currentDoctor);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
            const data = snap.data();
            
            // Map Firestore fields to HTML Input IDs
            if(document.getElementById("docSpecialty")) document.getElementById("docSpecialty").value = data.specialty || "";
            if(document.getElementById("docExperience")) document.getElementById("docExperience").value = data.experience || "";
            if(document.getElementById("docFees")) document.getElementById("docFees").value = data.fees || ""; 
            
            console.log("Profile data loaded: ", data);
        }
    } catch (e) { 
        console.error("Fetch Profile Error:", e); 
    }
};

/**
 * Saves the consultation fee and professional details to the 'users' collection.
 */
window.updateDoctorProfile = async function() {
    try {
        if (!currentDoctor) return;
        
        const docRef = doc(db, "users", currentDoctor);
        
        // Grab values from input fields
        const feeValue = document.getElementById("docFees").value;
        const specialtyValue = document.getElementById("docSpecialty").value;
        const experienceValue = document.getElementById("docExperience").value;

        // Ensure fee is not empty
        if (!feeValue) {
            alert("Please enter a consultation fee.");
            return;
        }

        // Update Firebase
        await updateDoc(docRef, {
            specialty: specialtyValue,
            experience: experienceValue,
            fees: feeValue // THE STATIC AMOUNT
        });

        alert("Profile and Consultation Fee saved successfully!");
        
    } catch (e) { 
        console.error("Save Error:", e);
        alert("Save Error: " + e.message); 
    }
};

// --- SCHEDULE MANAGEMENT ---
window.changeDay = function(day, fullName) {
    currentDay = day; // This must be the global variable defined at the top
    document.getElementById("slotHeader").innerText = "Manage Slots for " + fullName;
    
    // UI Update: Toggle active class on tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Crucial: Reload the data for the new day
    loadSchedule();
};

window.loadSchedule = async function() {
    const container = document.getElementById("slotsContainer");
    container.innerHTML = "<p style='color:var(--text-dim);'>Loading slots...</p>";

    try {
        const docSnap = await getDoc(doc(db, "doctors", currentDoctor));
        
        // Get availability object or default to empty
        const availability = (docSnap.exists() && docSnap.data().availability) 
                             ? docSnap.data().availability 
                             : {};
        
        // Get the specific array for the selected day (e.g., 'tue', 'wed')
        let activeSlots = availability[currentDay] || []; 

        container.innerHTML = "";
        timeTemplates.forEach(time => {
            const btn = document.createElement("div");
            // Check if this specific time is in the array for the current day
            btn.className = `slot-btn ${activeSlots.includes(time) ? 'active' : ''}`;
            btn.innerText = time;
            btn.onclick = () => btn.classList.toggle('active');
            container.appendChild(btn);
        });
    } catch (error) {
        console.error("Error loading schedule:", error);
        container.innerHTML = "Error loading slots.";
    }
};

window.saveSchedule = async function() {
    const docRef = doc(db, "doctors", currentDoctor);
    const selectedSlots = Array.from(document.querySelectorAll('.slot-btn.active')).map(el => el.innerText);

    try {
        const docSnap = await getDoc(docRef);
        let currentAvailability = docSnap.exists() ? (docSnap.data().availability || {}) : {};
        
        // Update ONLY the selected day
        currentAvailability[currentDay] = selectedSlots;

        await setDoc(docRef, { 
            availability: currentAvailability, 
            doctorId: currentDoctor 
        }, { merge: true });

        alert(`Schedule for ${currentDay.toUpperCase()} saved successfully!`);
    } catch (e) {
        alert("Error saving: " + e.message);
    }
};

// --- AUTH ---
window.logout = function() { 
    localStorage.clear(); 
    window.location.href = 'login.html'; 
};
let activeAppointmentId = null;

// 1. Updated Appointment List to make names clickable
window.loadAppointments = async function(containerId) {
    const listContainer = document.getElementById(containerId);
    if(!listContainer) return;
    
    const q = query(collection(db, "appointments"), where("doctorId", "==", currentDoctor));
    const snapshot = await getDocs(q);
    listContainer.innerHTML = "";

    snapshot.forEach(docSnap => {
        const app = docSnap.data();
        const isPaid = app.paymentStatus === "paid";

        const div = document.createElement("div");
        div.className = "appointment-item";
        div.innerHTML = `
            <div style="flex: 1;">
                <strong onclick="viewPatientDetails('${app.patientId}', '${docSnap.id}', '${app.patientName}')" 
                        style="cursor:pointer; color:var(--primary); text-decoration:underline;">
                    ${app.patientName}
                </strong>
                ${isPaid ? `<span style="color:#10b981; font-size:0.7rem; margin-left:10px;">[PAID]</span>` : ''}
                <br><small>${app.date} | ${app.time}</small>
            </div>
            <div>
                <select onchange="updateStatus('${docSnap.id}', this.value)">
                    <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${app.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        `;
        listContainer.appendChild(div);
    });
};

// 2. Fetch Patient Profile Details
window.viewPatientDetails = async function(patientId, appId, pName) {
    activeAppointmentId = appId;
    document.getElementById("m-patientName").innerText = "Case File: " + pName;
    document.getElementById("patientModal").style.display = "flex";

    try {
        // Fetch Medical Info from Users collection
        const userSnap = await getDoc(doc(db, "users", patientId));
        if (userSnap.exists()) {
            const data = userSnap.data();
            document.getElementById("m-blood").innerText = data.bloodGroup || "Not Provided";
            document.getElementById("m-age").innerText = data.age || "Not Provided";
            document.getElementById("m-disease").innerText = data.disease || "No known conditions";
        }

        // Fetch existing prescription if already written
        const appSnap = await getDoc(doc(db, "appointments", appId));
        document.getElementById("drPrescription").value = appSnap.data().prescription || "";
        
    } catch (e) { console.error(e); }
};

// 3. Save Prescription to the Appointment
window.savePrescription = async function() {
    const text = document.getElementById("drPrescription").value;
    if(!text) { alert("Please enter prescription details."); return; }

    try {
        await updateDoc(doc(db, "appointments", activeAppointmentId), {
            prescription: text,
            status: "completed" // Mark as done automatically
        });
        alert("Prescription saved successfully!");
        closePatientModal();
        refreshDashboard();
    } catch (e) { alert("Error: " + e.message); }
};

window.closePatientModal = () => { document.getElementById("patientModal").style.display = 'none'; };

// Start initialization on page load
document.addEventListener("DOMContentLoaded", loadDoctorInfo);