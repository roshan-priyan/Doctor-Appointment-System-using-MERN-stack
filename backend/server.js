const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();

// --- Middlewares ---
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Initialize Firebase Admin ---
const serviceAccount = require("./serviceAccountKey.json"); 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// --- Helper for Firestore Queries ---
const isValid = (val) => val !== undefined && val !== null && val !== 'undefined';

// --- 1. SLOT MANAGEMENT ROUTES ---

// Doctor creates a new available slot
app.post('/api/slots/open', async (req, res) => {
    try {
        const { doctorId, doctorName, date, time } = req.body;
        if (!isValid(doctorId)) return res.status(400).send("Doctor ID is required.");

        const newSlot = {
            doctorId,
            doctorName,
            date,
            time,
            isBooked: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection('slots').add(newSlot);
        res.json({ success: true, id: docRef.id });
    } catch (e) { res.status(500).send(e.message); }
});

// Patient fetches available (non-booked) slots for a specific doctor and date
app.get('/api/slots/available', async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!isValid(doctorId) || !isValid(date)) return res.status(400).send("DoctorId and Date required");

        const snapshot = await db.collection('slots')
            .where('doctorId', '==', doctorId)
            .where('date', '==', date)
            .where('isBooked', '==', false) 
            .get();
        
        let slots = [];
        snapshot.forEach(doc => slots.push({ id: doc.id, ...doc.data() }));
        res.json(slots);
    } catch (e) { res.status(500).send(e.message); }
});

// Get ALL slots for a specific doctor (Management View for Doctor)
app.get('/api/doctor/slots/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        if (!isValid(doctorId)) return res.status(400).send("Invalid Doctor ID");

        const snapshot = await db.collection('slots')
            .where('doctorId', '==', doctorId)
            .get();

        let slots = [];
        snapshot.forEach(doc => slots.push({ id: doc.id, ...doc.data() }));
        res.json(slots);
    } catch (e) { 
        res.status(500).send(e.message); 
    }
});

// Delete a slot
app.delete('/api/slots/:id', async (req, res) => {
    try {
        await db.collection('slots').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// --- 2. APPOINTMENT ROUTES ---

// Create appointment AND mark slot as booked
app.post('/api/book', async (req, res) => {
    try {
        const { patientId, patientName, doctorId, doctorName, date, time, slotId } = req.body;

        const appointmentData = {
            patientId, patientName, doctorId, doctorName, date, time,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const appRef = await db.collection('appointments').add(appointmentData);

        if (slotId) {
            await db.collection('slots').doc(slotId).update({ isBooked: true });
        }

        res.json({ success: true, id: appRef.id });
    } catch (e) { res.status(500).send(e.message); }
});

// Get Appointments for a Patient (History)
app.get('/api/appointments/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const snapshot = await db.collection('appointments')
            .where('patientId', '==', patientId)
            .get();

        let appointments = [];
        snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));
        res.json(appointments);
    } catch (e) { res.status(500).send(e.message); }
});

// Get Appointments for a Doctor (Requests)
app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        if (!isValid(doctorId)) return res.status(400).send("Invalid Doctor ID");

        const snapshot = await db.collection('appointments')
            .where('doctorId', '==', doctorId)
            .get();

        let appointments = [];
        snapshot.forEach(doc => appointments.push({ id: doc.id, ...doc.data() }));
        res.json(appointments);
    } catch (e) { res.status(500).send(e.message); }
});

// Update Status (Confirm/Reject)
app.put('/api/appointments/status', async (req, res) => {
    try {
        const { appId, status } = req.body;
        await db.collection('appointments').doc(appId).update({ status });
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// --- 3. DOCTOR LIST ROUTE ---
app.get('/api/doctors', async (req, res) => {
    try {
        const snapshot = await db.collection('users').where('role', '==', 'Doctor').get();
        let docs = [];
        snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
        res.json(docs);
    } catch (e) { res.status(500).send(e.message); }
});
// Send a message
app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, receiverId, text, senderName } = req.body;
        const message = {
            senderId,
            receiverId,
            text,
            senderName,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('messages').add(message);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// Get messages between two users
app.get('/api/messages/:userId/:otherId', async (req, res) => {
    try {
        const { userId, otherId } = req.params;
        const snapshot = await db.collection('messages')
            .where('senderId', 'in', [userId, otherId])
            .get();

        let msgs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter locally to ensure it's only between these two specific users
            if ((data.senderId === userId && data.receiverId === otherId) || 
                (data.senderId === otherId && data.receiverId === userId)) {
                msgs.push({ id: doc.id, ...data });
            }
        });
        
        // Sort by timestamp
        msgs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        res.json(msgs);
    } catch (e) { res.status(500).send(e.message); }
});

// Send a message
app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, receiverId, text, senderName } = req.body;
        const newMessage = {
            senderId,
            receiverId,
            senderName,
            text,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('messages').add(newMessage);
        res.json({ success: true });
    } catch (e) { res.status(500).send(e.message); }
});

// Fetch messages for a specific conversation
app.get('/api/messages/:userId/:otherId', async (req, res) => {
    try {
        const { userId, otherId } = req.params;
        // Querying for messages where the user is either the sender OR receiver
        const snapshot = await db.collection('messages')
            .where('senderId', 'in', [userId, otherId])
            .orderBy('timestamp', 'asc')
            .get();

        let msgs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Security filter to ensure messages are only between these two people
            if ((data.senderId === userId && data.receiverId === otherId) || 
                (data.senderId === otherId && data.receiverId === userId)) {
                msgs.push({ id: doc.id, ...data });
            }
        });
        res.json(msgs);
    } catch (e) { res.status(500).send(e.message); }
});
// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});