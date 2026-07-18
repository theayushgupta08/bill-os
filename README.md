# 📘 billOS

**billOS** is a modern, multi-tenant billing and invoicing SaaS application built with a premium tech stack:
- **Backend**: Spring Boot 3.3.x (Java 21) with Spring Security & JPA
- **Frontend**: Next.js 14 (App Router) with Tailwind CSS, shadcn/ui, and pnpm
- **AI Service**: Python FastAPI with LangGraph
- **Database**: PostgreSQL (via Supabase) with Flyway migrations
- **Infrastructure**: Docker Compose (Redis, Prometheus, Grafana)

---

## 🚀 Prerequisites

Ensure you have the following installed on your machine:
- **Java 21** (JDK)
- **Node.js 20+** & **pnpm** (Package Manager)
- **Python 3.12+** (For the AI Service)
- **Docker & Docker Compose** (For Redis and monitoring infrastructure)
- A **Supabase** account (or a remote PostgreSQL database)

---

## 🛠️ Setup & Running Locally

### 1. Start Infrastructure
The project relies on Redis for caching and Prometheus/Grafana for monitoring.
From the root directory, start the Docker containers:
```bash
docker-compose up -d
```

To stop the infrastructure when you're done:
```bash
docker-compose down
```

### 2. Configure the Database
The backend is configured to use a remote **Supabase PostgreSQL** instance. 
1. Create a new project in Supabase.
2. Get your database connection string.
3. Open `backend/src/main/resources/application.yml` and update the `spring.datasource.url`, `username`, and `password` fields with your Supabase credentials.

*(Note: The database schema is automatically managed by Flyway migrations on backend startup.)*

### 3. Install Dependencies
Before running the services, install all required dependencies (this will set up the frontend and initialize the AI service `venv`):
```bash
make install
```

### 4. Run the Application
You can start the Backend, Frontend, and AI Service simultaneously using the global Make command. This will open separate terminal windows for each service so you can monitor their logs individually:
```bash
make run
```
- **Backend API**: `http://localhost:8080`
- **Frontend App**: `http://localhost:3000`
- **AI Service**: `http://localhost:8000`

### Running Services Manually
If you prefer not to use `make run`, you can use the individual commands:
- `make backend-run`
- `make frontend-run`
- `make ai-run`

*(Note: The AI Service uses a Python virtual environment located at `ai-service/venv`. The make commands handle this automatically.)*

---

## 🧹 Code Formatting & Auto-Cleanup
This project uses the `spotless-maven-plugin` to automatically format Java code and remove unused imports. 
The plugin is bound to the `process-sources` phase, meaning it will automatically format your code whenever you run `mvn compile` or `mvn test`.

To manually format the code and remove unused imports without compiling, you can run:

**On Windows:**
```powershell
cd backend
.\mvnw.cmd spotless:apply
```

**On macOS/Linux:**
```bash
cd backend
./mvnw spotless:apply
```

---

## 🗂️ Project Structure
- `/backend`: Spring Boot application containing core business logic, authentication, and tenant-isolated database access.
- `/frontend`: Next.js frontend featuring a dashboard shell, organization onboarding, and authentication flow.
- `/ai-service`: Python FastAPI application built to handle AI-driven workflows via LangGraph.
- `/docs`: Extensive Product Requirements Documents (PRDs) and architecture plans.

## 🔒 Multi-Tenancy Architecture
This application uses Discriminator-based multi-tenancy (via Hibernate 6 `@TenantId`).
When a user logs in and selects an organization, the frontend sends an `X-Organization-Id` HTTP header. The backend automatically intercepts this header and scopes all database queries to that specific organization.