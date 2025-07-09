# 🚗 FixMyRide - Two-Wheeler Service CRM

A Web-based CRM system for managing customers and service requests in two-wheeler automobile service centers.


## 🧩 Project Highlights

* Role-based access: Admin, Manager, Staff
* Customer & service management
* Secure login with JWT
* Service status & analytics dashboard

---

## 🛠️ Tech Stack

**Frontend:** React, Tailwind CSS, Context API
**Backend:** Node.js, Express.js, MongoDB
**Auth:** JWT, Bcrypt
**Tools:** VS Code, Git, MongoDB Atlas

---

## 👥 User Roles & Permissions

| Role    | Permissions                                  |
| ------- | -------------------------------------------- |
| Admin   | Full control, manage users & records         |
| Manager | Handle customers, services, and view reports |
| Staff   | Add/edit services, view customers            |

---

## 🔑 Default Login Credentials

* **Admin:** `admin / admin123`
* **Manager:** `manager / manager123`
* **Staff:** `staff / staff123`

---

## 🚀 Key Features

* 🔐 **Secure Login** (JWT + Bcrypt)
* 👥 **Customer Auto-Creation** from service requests
* 🔧 **Service Tracking:** Status, Priority, Cost
* 📊 **Analytics Dashboard**
* 📂 **Role-based UI & Protected Routes**

---

## ▶️ How to Run

### 1. Clone Project

```bash
git clone https://github.com/your-username/fixMyRide.git
cd fixMyRide
```

### 2. Start Backend

```bash
cd crm-backend
npm install
npm run dev
# Runs at http://localhost:5000
```

### 3. Start Frontend

```bash
cd ../
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## 📁 Project Structure (Simplified)

```
fixMyRide/
├── crm-backend/         # Express API + MongoDB
│   ├── models/          # Admin, Customer, Request
│   ├── routes/          # Auth, Customers, Requests
├── components/          # React components (pages & UI)
├── lib/                 # API helper functions
```

---

## 🔐 Auth Flow

* Login → Receive JWT → Store in `localStorage`
* Protected API calls include token
* Role-based access enforced on backend & frontend

---

## 🔌 API Overview

* `POST /api/auth/login`
* `GET /api/customers`, `POST /api/customers`
* `GET /api/requests`, `POST /api/requests`
* `GET /api/dashboard/stats`
* `GET/POST /api/admin/users` *(Admin only)*

---

## 🧪 Environment Setup

`.env` file in `crm-backend/`:

```env
PORT=5000
MONGODB_URI=your-mongo-uri
JWT_SECRET=your-secret-key
```

---

## 🌐 Deployment 

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

---

## 📌 Summary

FixMyRide is a secure and scalable CRM solution tailored for two-wheeler workshops, demonstrating full-stack development with authentication, data management, and dashboard analytics.

---

## 💬 Contact

**Got questions?** Feel free to DM me on LinkedIn for any further questions or collaboration opportunities!

📧 **LinkedIn:** www.linkedin.com/in/akarshkhandelwal

---
