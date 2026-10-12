# Nexyvora Platform

**Nexyvora** is a hybrid digital platform combining an advanced Academic Learning Management System (LMS) with multi-tier subscription packages, multi-generation affiliate marketing, and a digital wallet ecosystem.

---

## 🌟 Key Features

### 🎓 1. Academic & Learning Management (LMS)
- **Programs & Specialties:** Multi-disciplinary educational paths with cohort management.
- **Formations & Video Courses:** Interactive modules with quizzes, attachments, and progress tracking.
- **Virtual Classrooms:** Live Zoom meeting integration with attendance logging.
- **Assignments & Grading:** Submission workflows and teacher evaluation portals.
- **Digital Diplomas:** Authenticated certificates with serial numbers and instant QR-code verification.

### 💼 2. Packages & FinTech Ecosystem
- **Tiered Packages:** Core, Flow, Grow, and Prime membership levels.
- **Digital Wallet:** Secure balance management, internal transfers, deposits, and withdrawal requests.
- **Affiliate & Matching Bonus:** Dynamic downline tree visualization supporting up to 10 generations of referral commissions.
- **Bonus Pools & Founders Club:** Automated profit distribution pools for top achievers and platform founders.

### 🛡️ 3. Security & Governance
- **Role-Based Access Control (RBAC):** Dedicated views and permissions for Admins, Teachers, and Students.
- **Identity & KYC:** Document verification workflows for enhanced financial security.
- **OTP Verification:** Multi-channel OTP support via Email (SMTP) and WhatsApp.
- **Rate Limiting & Protection:** Helmet security headers and strict rate-limiting on authentication endpoints.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn-ui, TanStack Query v5, Axios, Lucide Icons, i18next (RTL/LTR support).
- **Backend:** Node.js, Express, JWT, bcryptjs, Helmet, Express Rate Limit, Multer, Nodemailer.
- **Database:** MySQL 8.x / MariaDB (self-hosted).

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MAMP](https://www.mamp.info/) or MySQL Server (running on port 3306)

### 1. Database Setup
1. Open your MySQL client (e.g. phpMyAdmin via MAMP).
2. Create a database named `nexyvora`.
3. Import `mysql_schema.sql` into the `nexyvora` database.
4. Run migrations from `backend/migrations` if applicable.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your DB credentials and JWT secret
npm start
```
The backend server runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
# In the project root
npm install
cp .env.example .env  # Configure VITE_API_URL
npm run dev
```
The frontend will be available at `http://localhost:8080` (or `http://localhost:5173`).

---

## 📦 Production Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions on VPS or cPanel/Hostinger environments.

---

## 📄 License
Private & Proprietary - Nexyvora.
