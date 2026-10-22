async function bookAppointment() {
    const response = await fetch('http://localhost:3000/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patientId: "CURRENT_USER_ID", // Get this from Firebase Auth
            doctorId: "SELECTED_DOC_ID",
            date: "2026-03-10",
            time: "10:00 AM"
        })
    });
    const data = await response.json();
    if(data.success) alert("Booked!");
}