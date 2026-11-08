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
- **KYC Status:** Administrators review and set each member's verification status. (Self-service document upload is not implemented yet.)
- **Wallet PIN:** Every withdrawal requires a 4-6 digit PIN, stored as a bcrypt hash and locked for 30 minutes after 5 failed attempts.
- **Private Receipts:** Payment receipts are stored outside the public folder and served only to their owner and administrators.
- **Audited Impersonation:** Admin impersonation tokens last 1 hour, cannot target admins, block withdrawals, payout and password changes, and are written to `admin_audit_logs`.
- **Regulatory Country Rules:** Money movements use the most restrictive of the profile country and the trusted CDN country; the profile country is locked after KYC or financial activity.
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
4. Run the migrations in `backend/migrations` in order, e.g. `node backend/migrations/30_security_hardening.js`.

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

## 🧪 Checks & Tests

```bash
npm run typecheck          # frontend TypeScript check
npm run lint               # frontend ESLint
cd backend && npm test     # backend HTTP integration and security suites
```

The backend suite creates and deletes its own fixture records. To run it against an isolated database, set `NODE_ENV=test` and `DB_NAME_TEST` in `backend/.env`. One-off maintenance scripts live in `backend/scripts/dev/` and read credentials from environment variables.

---

## 📦 Production Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions on VPS or cPanel/Hostinger environments.

---

## 📄 License
Private & Proprietary - Nexyvora.
