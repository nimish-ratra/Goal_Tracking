# AtomQuest Architecture

AtomQuest is a robust, enterprise-grade Goal Setting & Tracking Portal built using a modern full-stack web architecture. The system is designed for scalability, security, and seamless integration with existing enterprise ecosystems (like Microsoft Entra ID and Teams). 

Below is the comprehensive architecture diagram illustrating the flow of data, components, and external services.

## System Architecture Diagram

```mermaid
graph TD
    %% Define styles for clarity
    classDef frontend fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff;
    classDef backend fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff;
    classDef database fill:#f59e0b,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef external fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:#fff;
    classDef client fill:#f9fafb,stroke:#d1d5db,stroke-width:2px,color:#1f2937;

    %% Client & User
    subgraph Users [Client Layer]
        E[Employee]:::client
        M[Manager]:::client
        A[Admin / HR]:::client
    end

    %% Frontend App (Vite + React)
    subgraph Frontend [Frontend: React + Vite + Tailwind]
        UI[UI Components & Layouts]:::frontend
        State[State Mgmt: React Context]:::frontend
        Queries[Data Fetching: TanStack Query]:::frontend
        AuthClient[MSAL Auth Context]:::frontend
        Charts[Analytics: Recharts]:::frontend
    end

    %% Backend Server (Node + Express)
    subgraph Backend [Backend: Node.js + Express]
        Router[API Router]:::backend
        AuthMid[Auth & RBAC Middleware]:::backend
        
        subgraph Controllers
            GoalCtrl[Goal Controller]:::backend
            CheckinCtrl[Checkin Controller]:::backend
            UserCtrl[User Controller]:::backend
            ReportCtrl[Report Controller]:::backend
            SSOCtrl[Azure SSO Controller]:::backend
        end
        
        subgraph Services
            EmailSvc[Email Service: Nodemailer]:::backend
            TeamsSvc[Teams Webhook Service]:::backend
            EscalationSvc[Escalation Engine]:::backend
        end
        
        ORM[Prisma ORM]:::backend
        Cron[Cron Job Scheduler]:::backend
    end

    %% Database Layer
    subgraph Data [Data Layer]
        DB[(PostgreSQL Database)]:::database
    end

    %% External Services
    subgraph External [External Integrations]
        AzureAD[Microsoft Entra ID / Azure AD]:::external
        MSGraph[Microsoft Graph API]:::external
        SMTP[SMTP Server / Nodemailer]:::external
        MSTeams[Microsoft Teams]:::external
    end

    %% Data Flow / Relationships
    
    %% Users to Frontend
    E -->|HTTPS| UI
    M -->|HTTPS| UI
    A -->|HTTPS| UI
    
    UI --> State
    UI --> Queries
    State --> AuthClient
    UI --> Charts
    
    %% Frontend to Backend
    Queries <-->|REST API / JSON| Router
    AuthClient -->|Access Token| SSOCtrl
    
    %% Backend Flow
    Router --> AuthMid
    AuthMid --> GoalCtrl
    AuthMid --> CheckinCtrl
    AuthMid --> UserCtrl
    AuthMid --> ReportCtrl
    
    %% Controller interactions
    GoalCtrl --> ORM
    CheckinCtrl --> ORM
    UserCtrl --> ORM
    ReportCtrl --> ORM
    SSOCtrl --> ORM
    
    %% Background services
    Cron -->|Daily Trigger| EscalationSvc
    EscalationSvc --> ORM
    
    %% Notifications
    GoalCtrl --> EmailSvc
    GoalCtrl --> TeamsSvc
    CheckinCtrl --> TeamsSvc
    EscalationSvc --> EmailSvc
    EscalationSvc --> TeamsSvc
    
    %% ORM to DB
    ORM <-->|TCP / SQL| DB
    
    %% External Integrations
    AuthClient <-->|OAuth 2.0 Popup| AzureAD
    SSOCtrl <-->|Validate Token| MSGraph
    EmailSvc -->|SMTP| SMTP
    TeamsSvc -->|Webhook HTTP POST| MSTeams
```

## Architectural Highlights

### 1. **Client Layer (React / Vite)**
- **Tailwind CSS & Shadcn UI:** For responsive, modern, and dark-mode compatible aesthetics.
- **Framer Motion:** Delivers fluid micro-animations and page transitions to ensure a premium user experience.
- **TanStack Query:** Manages asynchronous data fetching, caching, and background state synchronization efficiently without bloated global stores.

### 2. **Application Server (Node.js / Express)**
- **RESTful API:** Standardized JSON endpoints protected by robust `jwt`-based authentication and Role-Based Access Control (RBAC).
- **Service-Oriented Structure:** Business logic is decoupled into specific controllers and services (e.g., `emailService`, `teamsService`) allowing for easier testing and maintenance.
- **Intelligent Escalation Engine:** A `node-cron` scheduled job running within the server memory that proactively checks for missed deadlines and orchestrates notifications to Managers and Skip-level leaders.

### 3. **Data Layer (PostgreSQL / Prisma ORM)**
- **Prisma Client:** Provides type-safe database queries and automated schema migrations.
- **Relational Integrity:** Safely manages complex relationships, such as Goal inheritance, multi-quarter tracking data, and recursive User reports (Manager $\rightarrow$ Employee).

### 4. **Enterprise Integrations**
- **Microsoft Entra ID (SSO):** Implemented via `@azure/msal-react` (Client) and Microsoft Graph API (Server) for secure authentication and instant organizational sync.
- **Microsoft Teams:** Uses Adaptive Cards via Webhooks to push actionable rich-text notifications directly into enterprise workflows.
- **Email Notifications:** Uses `nodemailer` with compiled `handlebars` HTML templates for beautifully structured transactional emails.
