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

### 3. Run the Backend (Spring Boot API)
Open a terminal in the `backend` directory and run the Spring Boot application using the Maven wrapper:

**On Windows:**
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**On macOS/Linux:**
```bash
cd backend
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080`.

### 4. Run the Frontend (Next.js)
Open a new terminal in the `frontend` directory, install dependencies, and start the development server:

```bash
cd frontend
pnpm install
pnpm dev
```
The web application will be available at `http://localhost:3000`.

### 5. Run the AI Service (FastAPI)
Open a new terminal in the `ai-service` directory, set up a virtual environment, and start the API:

```bash
cd ai-service

# Create and activate a virtual environment
python -m venv .venv

# On Windows
.venv\Scripts\activate
# On macOS/Linux
# source .venv/bin/activate

# Install dependencies (if you have a requirements file, otherwise install manually)
pip install fastapi uvicorn pydantic

# Run the server
uvicorn app.main:app --reload --port 8000
```
The AI Service will be available at `http://localhost:8000`.

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