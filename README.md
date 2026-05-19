# ⚡ AtomQuest: Enterprise Goal Setting & Tracking Portal

AtomQuest is a comprehensive, production-ready Goal Setting & Tracking Portal. It empowers employees, managers, and HR administrators to set, track, review, and analyze performance goals dynamically across designated cycles and quarters.

## 🌟 Key Features

### Core Functionality
- **Role-Based Workflows:** Distinct, fully-featured dashboards for Employees, Managers, and Admins.
- **Dynamic Goal Management:** Set up to 8 goals per cycle with varying Units of Measurement (Numeric Max/Min, Timeline, Zero=Success).
- **Interactive Check-ins:** Intuitive, window-based quarterly check-ins allowing precise actuals and manager feedback tracking.
- **Strict Validation:** Real-time weightage validation ensuring goal sheets always equal exactly 100% prior to submission.
- **Cycle & Quarter Management:** Granular HR admin tools to open/close submission windows dynamically.

### Advanced Enterprise Integrations
- **Microsoft Entra ID (Azure AD) SSO:** Seamless 1-click corporate login via Microsoft Graph. Automatically syncs organizational structure, roles, and manager relationships.
- **Email & Teams Notifications:** Rich HTML transactional emails (Nodemailer) and Adaptive Cards sent via MS Teams webhooks for check-in reminders and approval requests.
- **Intelligent Escalation Engine:** Background scheduled jobs (`node-cron`) that actively monitor for overdue actions (missed submissions or approvals) and intelligently escalate them to managers or skip-level leaders.
- **Advanced Analytics:** Dynamic visual reports using Recharts, allowing HR to track goal status, departmental adherence, and completion rates.

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Shadcn UI, Framer Motion (for premium micro-animations), TanStack Query, Recharts.
- **Backend:** Node.js, Express, JSON Web Tokens (JWT), HTTP-only cookies.
- **Database:** PostgreSQL with Prisma ORM.
- **Integrations:** `@azure/msal-react`, `@azure/msal-node`, `microsoft-graph-client`, `nodemailer`.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- (Optional) Microsoft Azure Tenant for SSO integration.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nimish-ratra/Goal_Tracking.git
   cd Goal_Tracking
   ```

2. **Install dependencies:**
   ```bash
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

3. **Environment Setup:**
   Ensure your `.env` files are properly configured.
   
   **`server/.env`:**
   ```env
   PORT=3001
   DATABASE_URL=postgresql://user:password@localhost:5432/atomquest
   JWT_SECRET=supersecretjwt
   JWT_REFRESH_SECRET=supersecretrefreshjwt
   # Azure AD
   AZURE_TENANT_ID=your-tenant-id
   AZURE_CLIENT_ID=your-client-id
   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email
   SMTP_PASS=your-password
   ```

   **`client/.env`:**
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_AZURE_SSO_ENABLED=true
   VITE_AZURE_CLIENT_ID=your-client-id
   VITE_AZURE_TENANT_ID=your-tenant-id
   ```

4. **Database Migration & Seeding:**
   ```bash
   cd server
   npx prisma migrate dev
   npm run seed
   ```

5. **Run the Application:**
   From the project root directory:
   ```bash
   npm run dev
   ```
   The portal will be available at `http://localhost:5173`.

## 📊 Architecture

For an in-depth look at the data flow, application boundaries, and external integrations, please see our [Architecture Diagram](./architecture-diagram.md).

---
*Built with ❤️ for modern performance management.*
