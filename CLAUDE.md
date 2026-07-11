# CLAUDE.md — billOS Project Intelligence

This file provides context for AI assistants (Claude, etc.) working on the billOS codebase.

## Project Overview

billOS is a **multi-tenant billing and invoicing SaaS application** built by Shrialok AI Labs. It consists of three services and supporting infrastructure.

## Architecture

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Frontend   │───▶│  Backend (API)   │───▶│  AI Service  │
│  Next.js 16  │    │ Spring Boot 3.3  │    │   FastAPI     │
│  Port: 3000  │    │   Port: 8080     │    │  Port: 8000   │
└──────────────┘    └───────┬──────────┘    └──────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Supabase │  │  Redis   │  │Prometheus│
        │PostgreSQL│  │  :6379   │  │ /Grafana │
        └──────────┘  └──────────┘  └──────────┘
```

## Tech Stack — Exact Versions Matter

| Layer       | Technology                       | Version / Notes                     |
|-------------|----------------------------------|-------------------------------------|
| Backend     | Spring Boot + Spring Security    | 3.3.1, Java 21                      |
| ORM         | Hibernate 6 (via Spring Data JPA)| Discriminator-based multi-tenancy   |
| Auth        | JWT (jjwt 0.12.5)               | Custom filter chain                 |
| Migrations  | Flyway                           | `backend/src/main/resources/db/`    |
| Mapping     | MapStruct 1.5.5                  | Annotation processor with Lombok    |
| API Docs    | SpringDoc OpenAPI 2.5.0          | Swagger UI at `/swagger-ui.html`    |
| Frontend    | Next.js (App Router)             | 16.2.10, React 19                   |
| Styling     | Tailwind CSS 4 + shadcn/ui 4     | PostCSS pipeline                    |
| Package Mgr | pnpm                             | Workspace-enabled                   |
| AI Service  | FastAPI + LangGraph + LangChain  | Python 3.12+                        |
| Database    | PostgreSQL (Supabase-hosted)     | Remote instance                     |
| Caching     | Redis 7                          | Docker container                    |
| Monitoring  | Prometheus + Grafana             | Docker containers                   |

## Repository Structure

```
billOS/
├── backend/                    # Spring Boot API (Maven)
│   ├── pom.xml
│   └── src/main/java/com/billos/api/
│       ├── BillOsApplication.java
│       ├── controller/         # REST controllers
│       ├── entity/             # JPA entities (BaseEntity, User, Organization, UserOrgRole)
│       ├── repository/         # Spring Data JPA repositories
│       ├── security/           # JWT auth (filter, provider, config)
│       ├── service/            # Business logic layer
│       └── tenant/             # Multi-tenancy (TenantContext, TenantFilter, TenantIdentifierResolver)
├── frontend/                   # Next.js App (pnpm)
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login / register route group
│       │   ├── (dashboard)/    # Main dashboard route group
│       │   ├── (onboarding)/   # Org onboarding route group
│       │   ├── globals.css
│       │   ├── layout.tsx      # Root layout
│       │   └── page.tsx        # Landing page
│       ├── components/         # Reusable UI components (shadcn)
│       └── lib/                # Utilities and helpers
├── ai-service/                 # Python FastAPI + LangGraph
│   ├── pyproject.toml          # Hatchling build, ruff + mypy config
│   └── app/
├── docs/                       # 18 PRD documents (01–18)
│   ├── 01-project-overview.md
│   ├── ...
│   └── 18-performance-targets.md
├── docker-compose.yml          # Redis, Prometheus, Grafana
└── CLAUDE.md                   # ← You are here
```

## Critical Architectural Patterns

### Multi-Tenancy (MUST FOLLOW)

This is the most important pattern in the codebase. Every tenant-scoped entity and query **must** respect this:

- **Strategy**: Discriminator-based via Hibernate 6 `@TenantId` annotation.
- **Header**: Frontend sends `X-Organization-Id` HTTP header on every API request.
- **Flow**: `TenantFilter` → extracts header → sets `TenantContext` (ThreadLocal) → `TenantIdentifierResolver` reads it → Hibernate scopes all queries.
- **Rule**: When creating new entities that belong to an organization, **always** add `@TenantId` to the org ID field. Never query cross-tenant data without explicit justification.

### Authentication & Security

- JWT-based auth using `JwtTokenProvider` and `JwtAuthenticationFilter`.
- `CustomUserDetailsService` loads users from the database.
- `SecurityConfig` defines the filter chain — `JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter`.
- `UserPrincipal` wraps the authenticated user.

### Entity Design

- All entities extend `BaseEntity` (provides `id`, `createdAt`, `updatedAt`).
- Core entities: `User`, `Organization`, `UserOrgRole`.
- Use Lombok (`@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`) on entities.
- Use MapStruct for DTO ↔ Entity mapping (never map manually).

## Development Commands

### Backend (Spring Boot)
```powershell
# Run (from /backend)
.\mvnw.cmd spring-boot:run

# Build
.\mvnw.cmd clean package

# Run tests
.\mvnw.cmd test
```

### Frontend (Next.js)
```powershell
# Install deps (from /frontend)
pnpm install

# Dev server
pnpm dev

# Build
pnpm build

# Lint
pnpm lint
```

### AI Service (FastAPI)
```powershell
# Setup (from /ai-service)
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"

# Run
uvicorn app.main:app --reload --port 8000
```

### Infrastructure
```powershell
# Start Redis + Prometheus + Grafana (from root)
docker-compose up -d
```

## Coding Conventions

### Backend (Java)
- Package structure: `com.billos.api.{layer}` (controller, service, repository, entity, security, tenant)
- Follow standard Spring layering: Controller → Service → Repository
- Use constructor injection (Lombok `@RequiredArgsConstructor`), never `@Autowired` on fields
- DTOs go in a `dto` sub-package when created; use records where possible
- Flyway migrations in `src/main/resources/db/migration/` with naming `V{n}__{description}.sql`
- Validation via `@Valid` and `spring-boot-starter-validation` annotations

### Frontend (TypeScript/React)
- Next.js App Router with route groups: `(auth)`, `(dashboard)`, `(onboarding)`
- Use shadcn/ui components (installed via `shadcn` CLI, stored in `components/ui/`)
- Tailwind CSS 4 for styling — use utility classes, avoid custom CSS unless necessary
- Keep components in `src/components/`, utilities in `src/lib/`

### AI Service (Python)
- Strict mypy + ruff for linting (configured in `pyproject.toml`)
- Line length: 100 characters
- Target Python 3.12+
- Use Pydantic v2 models for all request/response schemas

## Testing Rules (MANDATORY)

> **Core Rule: Every new service, controller, or utility MUST ship with unit tests. Every modification to existing code MUST update or add corresponding tests.**

### When to Write / Update Tests

| Action | Test Requirement |
|--------|-----------------|
| Create a new service class | Write a corresponding `*ServiceTest.java` with tests for all public methods |
| Create a new controller | Write a `*ControllerTest.java` covering happy path, validation errors, 404, and auth |
| Add a new method to an existing service | Add test methods to the existing test class |
| Modify business logic in a service | Update affected tests to match new behavior; add edge-case tests if logic grew |
| Create a new frontend utility/hook | Write a corresponding `.test.ts` file |
| Create a new React component | Write a `.test.tsx` file with render + interaction tests |
| Add/modify an AI service endpoint | Add/update `test_*.py` covering request validation and response shape |
| Fix a bug | Add a regression test that reproduces the bug before verifying the fix |

### Backend Tests (JUnit 5 + Mockito + AssertJ)

**Location:** `backend/src/test/java/com/billos/api/` — mirror the `main` package structure.

```
backend/src/test/java/com/billos/api/
├── service/
│   ├── OrganizationServiceTest.java
│   └── InvoiceServiceTest.java
├── controller/
│   └── AuthControllerTest.java
└── tenant/
    └── TenantFilterTest.java
```

**Conventions:**
- Use `@ExtendWith(MockitoExtension.class)` for unit tests (no Spring context).
- Use `@InjectMocks` for the class under test; `@Mock` for all dependencies.
- Name test methods: `should{ExpectedBehavior}_when{Condition}()` (e.g., `shouldThrowException_whenOrganizationNotFound()`).
- Use AssertJ assertions (`assertThat(...)`) — never JUnit's raw `assertEquals`.
- Test tenant isolation: verify that queries respect `@TenantId` boundaries.
- **Coverage target: ≥ 80% line coverage** (enforced via JaCoCo).

**Example pattern:**
```java
@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private OrganizationService organizationService;

    @Test
    void shouldReturnOrganization_whenIdExists() {
        // Arrange
        var org = Organization.builder().id(UUID.randomUUID()).name("Test Org").build();
        when(organizationRepository.findById(org.getId())).thenReturn(Optional.of(org));

        // Act
        var result = organizationService.getById(org.getId());

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Test Org");
        verify(organizationRepository).findById(org.getId());
    }
}
```

### Frontend Tests (Vitest + React Testing Library)

**Location:** Co-locate test files next to source files with `.test.ts` / `.test.tsx` suffix.

```
frontend/src/
├── lib/
│   ├── utils.ts
│   └── utils.test.ts        ← co-located
├── components/
│   ├── InvoiceTable.tsx
│   └── InvoiceTable.test.tsx ← co-located
```

**Conventions:**
- Use `describe` / `it` blocks; name tests as user-facing behavior.
- Use `@testing-library/react` for component tests — query by role/label, not class names.
- Mock API calls with `vi.mock()` or MSW.
- **Coverage target: ≥ 70%** for utilities, ≥ 60% for components.

### AI Service Tests (pytest)

**Location:** `ai-service/tests/` directory.

```
ai-service/
├── app/
│   ├── main.py
│   └── routes/
└── tests/
    ├── test_main.py
    └── test_routes/
```

**Conventions:**
- Use `pytest` with `httpx.AsyncClient` for endpoint tests.
- Use `@pytest.mark.parametrize` for input variations.
- Include prompt regression tests for AI workflows (see `docs/13-testing-strategy.md`).

### Running Tests

```powershell
# Backend — run all tests
cd backend
.\mvnw.cmd test

# Backend — run a single test class
.\mvnw.cmd test -Dtest=OrganizationServiceTest

# Frontend — run all tests
cd frontend
pnpm test

# AI Service — run all tests
cd ai-service
pytest
```

## Documentation Reference

The `/docs` folder contains extensive PRDs. Key documents for understanding intent:
- `06-system-architecture.md` — Full system architecture
- `07-folder-structure.md` — Intended project structure
- `08-database-design.md` — Complete database schema design
- `12-best-practices.md` — Coding standards and patterns
- `17-coding-standards.md` — Detailed coding conventions

**Always check these docs before making architectural decisions.**

## Common Pitfalls

1. **Forgetting `@TenantId`** — Any new org-scoped entity MUST have the tenant annotation or data will leak across organizations.
2. **Lombok + MapStruct ordering** — In `pom.xml`, Lombok's annotation processor MUST come before MapStruct's processor.
3. **pnpm, not npm** — The frontend uses pnpm workspaces. Never use `npm install`.
4. **Flyway migration naming** — Migrations are immutable once committed. Never edit an existing migration; create a new one.
5. **Supabase connection** — The database is remote (Supabase-hosted PostgreSQL). Credentials are in `application.yml` — never commit real secrets.
6. **Next.js 16 + React 19** — These are very recent versions. Be careful with library compatibility and avoid patterns deprecated in React 19 (e.g., `forwardRef` is no longer needed).
