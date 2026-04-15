# RideFlow: Advanced Ride-Sharing & Women's Safety System

RideFlow is a comprehensive, micro-architected ride-sharing platform designed with a focus on **Women's Safety**, real-time transparency, and administrative control. It combines a high-performance FastAPI backend with a modern Next.js dashboard to provide a seamless experience for Passengers, Drivers, and Admins.

---

## 🎯 Motive
Traditional ride-sharing often lacks granular control over safety preferences and platform-wide transparency. RideFlow was built to empower users—especially female passengers—by providing a secure environment where trust is built through role verification and specific safety features like Female-to-Female driver matching.

## 🛑 Problem Statement
1.  **Safety Concerns**: Female passengers often feel unsafe with unknown male drivers during late-night or long-distance rides.
2.   **Administrative Overhead**: Managing driver approvals and platform health manually is slow and prone to errors.

## ✅ The Solution
1.  **Women's Safety First**: A dedicated "Women Only" feature that prioritizes matching female passengers with female drivers.
2.  **Real-time Interaction**: WebSocket-driven ride requests and status updates.
3.  **Automated Onboarding**: Streamlined driver registration with an Admin approval dashboard.


---

## 🏗️ System Architecture

RideFlow follows a containerized, service-oriented architecture:

-   **Client Layer**: A responsive Next.js frontend that adapts to Passenger, Driver, or Admin roles.
-   **API Layer**: A high-speed FastAPI backend implementing JWT-based authentication, WebSocket management, and RESTful endpoints.
-   **Data Layer**: 
    -   **PostgreSQL**: The primary relational database for users, rides, and profiles.
-   **Orchestration**: Docker Compose manages the lifecycle of the Database, Backend, Frontend, and pgAdmin services.

---

## 🚀 Technical Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Vanilla CSS
- **Icons/Animations**: Lucide React & Framer Motion
- **State/Data**: Axios, React Context, & Native WebSockets

### **Backend**
- **Framework**: FastAPI (Asynchronous Python)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15
- **Security**: Passlib (Bcrypt hashing), Python-JOSE (JWT tokens)
- **Communications**: Native WebSockets for real-time broadcasting

### **DevOps & Data**
- **Containerization**: Docker & Docker Compose
- **Migrations**: Alembic
- **Monitoring**: pgAdmin 4

---

## 🛠️ Quick Start (Docker)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/snehavvv/Ride-flow.git
    cd Ride-flow
    ```

2.  **Launch Services**:
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the Platform**:
    - **Frontend**: `http://localhost:3000`
    - **Backend API Docs**: `http://localhost:8000/docs`
    - **pgAdmin**: `http://localhost:5050` (Email: `admin@rideflow.com`, Pass: `admin123`)

---

## 🔑 Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `sneha21@gmail.com` | `Admin#123` |
| **Driver (Mock)** | `rahul@driver.com` | `Driver#123` |
| **Driver (Mock)** | `priya@driver.com` | `Driver#123` |

---

## 🔒 Security & Sanitization
The repository is sanitized and ready for production:
- All sensitive environment variables are managed via `.env` files (excluded from Git).
- Passwords are encrypted using Bcrypt with standard salts.
- CORS policies are strictly enforced to allow only trusted origins.

---
*Developed with ❤️ by the RideFlow Team.*
