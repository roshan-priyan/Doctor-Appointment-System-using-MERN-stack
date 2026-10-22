# 🩺 Doctor Appointment Management System (MERN Stack)

A full-stack, user-friendly web application designed to streamline the process of booking and managing doctor appointments. Built on the MERN stack, this system bridges the gap between healthcare providers and patients by offering a centralized digital platform for scheduling, patient record management, and real-time status updates.

The application features a dual-dashboard architecture tailored for two primary user roles (Patients and Doctors), ensuring a seamless and efficient experience for both sides of the consultation process.

## 🚀 Core Features

*   **Patient Portal:** Allows patients to easily search for healthcare professionals based on medical specialty, geographical location, or real-time availability.
*   **Seamless Booking:** Patients can schedule appointments effortlessly and view their comprehensive appointment history.
*   **Doctor Dashboard:** Equips doctors with a powerful administrative tool to manage their daily schedules dynamically and view essential patient information prior to consultations.
*   **Real-Time Status Updates:** Doctors can confirm, reschedule, or mark appointments as completed, ensuring a smooth workflow.
*   **Secure Authentication:** Protects user data and ensures that patients and doctors only have access to their respective dashboards.
*   **Profile Management:** Users can securely update and manage their personal profile information.

## 🛠️ Technology Stack

**Frontend (Client Layer)**
*   **Languages:** HTML5, CSS3, JavaScript (ES6+)
*   **UI/UX:** Responsive design ensuring cross-browser compatibility
*   **Data Fetching:** Fetch API for seamless communication with the backend REST APIs

**Backend (Orchestration Layer)**
*   **Runtime Environment:** Node.js
*   **Framework:** Express.js
*   **Authentication:** Secure token-based authentication (JWT)
*   **API:** RESTful API architecture

**Database Layer**
*   **Database:** MongoDB
*   **ODM:** Mongoose (for schema definition and data modeling)

## 📂 Project Structure

```text
Doctor-Appointment-System/
│
├── backend/
│   ├── models/                 # MongoDB schemas (User, Doctor, Appointment)
│   ├── routes/                 # Express API endpoints (auth, doctors, appointments)
│   ├── controllers/            # Business logic for handling requests
│   ├── package.json            # Backend dependencies
│   └── server.js               # Main Express server entry point
│
├── frontend/
│   ├── css/                    # Stylesheets
│   ├── js/                     # Client-side logic (app.js, auth.js, doctor.js)
│   ├── index.html              # Main landing page
│   ├── login.html              # User authentication interface
│   ├── signup.html             # User registration interface
│   └── doctor-dashboard.html   # Doctor's administrative view
│
└── README.md                   # Project documentation
```

## ⚙️ System Workflow Pipeline

1.  **User Authentication:** A patient or doctor logs into the system using secure credentials. The backend validates the user and returns a JWT.
2.  **Doctor Search (Patient):** The patient queries the database by specialty or location. The frontend sends a request to the backend, which fetches matching doctor profiles from MongoDB.
3.  **Booking an Appointment:** The patient selects an available time slot. An appointment document is created in the database and linked to both the patient and the doctor.
4.  **Schedule Management (Doctor):** The doctor logs in and fetches their appointments. They can update the status of an appointment (e.g., from "Pending" to "Confirmed"), which updates the MongoDB record in real-time.

## 🔧 Setup & Installation

### Prerequisites
*   **Node.js** (v14 or higher)
*   **MongoDB** (Local installation or a MongoDB Atlas cloud account)
*   A modern web browser

### 1. Clone the Project
```bash
git clone https://github.com/roshan-priyan/Doctor-Appointment-System-using-MERN-stack.git
cd Doctor-Appointment-System-using-MERN-stack
```

### 2. Backend Setup
```bash
cd backend
npm install
```
*   **Environment Variables:** Create a `.env` file in the `backend` folder and add the following:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret_key
    ```
*   **Run the Server:**
    ```bash
    npm start
    # or node server.js
    ```
    The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Since the frontend uses standard HTML/CSS/JS, you can simply run it using a local server.
*   Open a new terminal.
*   Navigate to the frontend folder: `cd frontend`
*   If using VS Code, right-click `index.html` and select **"Open with Live Server"**.
*   The application will open in your browser at `http://127.0.0.1:5500`.

## 📸 Screenshots

*(Replace these placeholder links with actual screenshots once you upload them to your GitHub!)*

| Home Page | Doctor Dashboard |
| :---: | :---: |
| <img src="YOUR_HOMEPAGE_IMAGE_LINK_HERE" width="400" /> | <img src="YOUR_DASHBOARD_IMAGE_LINK_HERE" width="400" /> |

## 👨‍💻 Author

**Roshan Priyan**

*   M.Tech (Integrated) Software Engineering - Vellore Institute of Technology (VIT)
*   GitHub: [https://github.com/roshan-priyan](https://github.com/roshan-priyan)
*   LinkedIn: (https://www.linkedin.com/in/roshanpriyan-vs/)

## ⭐ Support
If you found this project useful, consider giving the repository a star! Your support is greatly appreciated.
