# CLAUDE.md — billOS Project Intelligence

Operating guide for AI assistants working on the billOS codebase. Read this before implementing a
feature or fixing a bug. It describes **what the code actually does today**, not just intent — where
reality and the PRDs in `/docs` disagree, this file records reality and flags the gap.

> **Maintenance rule:** whenever you change an architectural pattern, add a service/module, change a
> command, upgrade a major dependency, or close one of the gaps in [Known Gaps](#known-gaps--tech-debt),
> update this file in the same change. See [Keeping this file current](#keeping-this-file-current).

---

## 1. Project Overview

billOS is a **multi-tenant, GST-compliant billing / inventory / accounting SaaS** for Indian SMBs,
built by Shrialok AI Labs Pvt. Ltd. Three services plus supporting infrastructure.

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Frontend   │───▶│  Backend (API)   │───▶│  AI Service  │
│  Next.js 16  │    │ Spring Boot 3.3  │    │   FastAPI    │
│  Port: 3000  │    │   Port: 8080     │    │  Port: 8000  │
└──────┬───────┘    └───────┬──────────┘    └──────────────┘
       │                    │
       │ auth         ┌─────┼─────────────┬──────────────┐
       ▼              ▼     ▼             ▼              ▼
┌──────────────┐ ┌──────────┐  ┌──────────┐  ┌──────────────┐
│Supabase Auth │ │ Supabase │  │  Redis   │  │  Prometheus  │
│  (GoTrue)    │ │PostgreSQL│  │  :6379   │  │  / Grafana   │
└──────────────┘ └──────────┘  └──────────┘  └──────────────┘
```

**Functional surface (implemented):** organizations & onboarding, team/roles/invites, customers,
suppliers, products & categories, warehouses & inventory levels & stock movements, tax rates,
quotations → sales orders → sales invoices, purchase orders → purchase bills, payments &
allocations, chart of accounts & journal entries, GST reports (GSTR-1 / GSTR-3B), P&L,
receivables/payables, stock & sales/purchase reports, audit logs, PDF document generation,
field-collections module (QR codes, cash collection, expenses, settlement deposits, ledger),
notifications.

**AI service is a stub** — only `/ai/health` and `/` exist. LangGraph/LangChain deps are installed
but no graphs are built yet.

---

## 2. Tech Stack — Exact Versions Matter

| Layer          | Technology                          | Version / Notes                                        |
|----------------|-------------------------------------|--------------------------------------------------------|
| Backend        | Spring Boot                         | 3.3.1, Java 21                                         |
| ORM            | Hibernate 6 (Spring Data JPA)       | Discriminator multi-tenancy via `@TenantId`            |
| Auth (current) | Supabase Auth (GoTrue) + JWT verify | Backend verifies HS256 Supabase JWTs (`jjwt` 0.12.5)   |
| Migrations     | Flyway                              | `backend/src/main/resources/db/migration/` (V001–V016) |
| Mapping        | MapStruct 1.5.5.Final               | `componentModel = "spring"`, unmapped targets IGNOREd  |
| PDF            | openhtmltopdf 1.0.10 + Thymeleaf    | HTML templates → PDF                                   |
| Email          | Resend (`resend-java` 3.1.0)        | `EmailService`                                         |
| Rate limiting  | Bucket4j 8.10.1 + Redis             | `RateLimitInterceptor` (per-IP / per-user / per-tenant)|
| Java format    | Spotless + palantir-java-format     | Auto-applies on `process-sources` — **do not hand-format** |
| API docs       | SpringDoc OpenAPI 2.5.0             | `/swagger-ui/index.html`                               |
| Frontend       | Next.js App Router                  | 16.2.10, React 19.2.4                                  |
| Data fetching  | TanStack Query v5 + axios           | `apiClient` interceptors in `src/lib/api-client.ts`    |
| URL state      | nuqs 2                              | `NuqsAdapter` in `src/providers/query-provider.tsx`    |
| UI primitives  | **@base-ui/react** 1.6 + shadcn 4   | Base UI, *not* Radix. Components in `components/ui/`   |
| Styling        | Tailwind CSS 4                      | PostCSS pipeline, `tw-animate-css`, `next-themes`      |
| Icons / toasts | lucide-react / sonner               |                                                        |
| Motion         | framer-motion 12                    | Landing pages mostly                                   |
| Package mgr    | pnpm                                | **Never npm/yarn** (a stray `package-lock.json` exists — delete it, don't feed it) |
| AI Service     | FastAPI + LangGraph + LangChain     | Python ≥ 3.12, hatchling, ruff + strict mypy           |
| Database       | PostgreSQL (Supabase-hosted)        | Remote; local fallback `localhost:5432/postgres`       |
| Cache          | Redis 7                             | Docker container                                       |
| Monitoring     | Prometheus + Grafana                | Docker; **backend is not yet scraped** (see gaps)      |

---

## 3. Repository Map

```
billOS/
├── backend/                          # Spring Boot API (Maven wrapper: mvnw.cmd)
│   └── src/main/java/com/billos/api/
│       ├── BillOsApplication.java
│       ├── config/                   # RedisConfig, WebMvcConfig (registers RateLimitInterceptor)
│       ├── controller/               # 24 REST controllers, all under /api/v1/**
│       ├── dto/                      # Lombok @Data DTOs (not records — see §6.4)
│       ├── entity/                   # JPA entities + status/type enums
│       ├── mapper/                   # MapStruct interfaces
│       ├── repository/               # Spring Data JPA repositories
│       ├── security/                 # JWT filter/provider, SecurityConfig, TenantSecurity,
│       │                             #   UserPrincipal, RateLimitInterceptor/Service
│       ├── service/                  # Business logic
│       └── tenant/                   # TenantContext, TenantFilter, TenantIdentifierResolver
│   └── src/main/resources/
│       ├── application.yml
│       ├── db/migration/             # Flyway V001..V016
│       └── templates/                # invoice/po/quotation HTML → PDF
├── frontend/                         # Next.js (pnpm)
│   └── src/
│       ├── app/
│       │   ├── (auth)/               # login, register, forgot-password
│       │   ├── (dashboard)/          # thin route pages → delegate to src/features/*
│       │   ├── (landing)/            # marketing + legal pages
│       │   ├── (onboarding)/setup/   # org creation
│       │   └── accept-invite/
│       ├── components/
│       │   ├── ui/                   # shadcn/Base UI primitives — do not hand-edit casually
│       │   ├── layout/ landing/ settings/ team/
│       ├── features/<domain>/        # components/ + hooks/  ← the real feature code lives here
│       ├── lib/                      # api-client, config, use-organization, utils, supabase/
│       └── providers/query-provider.tsx
├── ai-service/                       # FastAPI (stub)
├── docs/                             # 18 PRDs + code-review.md
├── prometheus/prometheus.yml
├── docker-compose.yml                # Redis, Prometheus, Grafana
├── Makefile                          # Windows-oriented task runner (see §5)
└── .github/workflows/ci.yml
```

---

## 4. Critical Architectural Patterns

### 4.1 Multi-Tenancy — the single most important rule

- **Strategy:** discriminator column via Hibernate 6 `@TenantId` on `organizationId`.
- **Transport:** the frontend sends `X-Organization-Id` on every request (injected by the axios
  request interceptor from `localStorage.active_org_id`).
- **Flow:** `TenantFilter` (`@Order(1)`) reads the header → `TenantContext` (ThreadLocal) →
  `TenantIdentifierResolver` → Hibernate auto-filters every query and stamps every insert.
- `TenantFilter` **always** clears the ThreadLocal in a `finally` block. Any new thread-boundary
  crossing (`@Async`, `CompletableFuture`, scheduled jobs) must propagate/clear the tenant manually —
  ThreadLocals do not inherit.

**Rules for new code:**

| Entity kind | `@TenantId` on `organizationId`? |
|---|---|
| Top-level org-scoped aggregate (`SalesInvoice`, `Product`, `Customer`, …) | **Yes, required** |
| Child/line entity reached only via its parent (`SalesInvoiceLine`, `PurchaseOrderLine`, `JournalEntryLine`, `PaymentAllocation`) | No — no `organization_id` column; isolation comes from the parent |
| Global entities (`User`, `Organization`) | No |
| `OrganizationSettings`, `OrganizationInvitation` | Currently **plain `organizationId` column, no `@TenantId`** — you must filter by org explicitly in the repository/service. Treat this as a known inconsistency, not a template. |

- Never write a cross-tenant query without an explicit, commented justification.
- In services, read the tenant with `UUID.fromString(TenantContext.getCurrentTenant())` (this is the
  established idiom — but see [Known Gaps](#known-gaps--tech-debt) about the missing null guard).
- Unit tests **must** call `TenantContext.setCurrentTenant(UUID.randomUUID().toString())` in
  `@BeforeEach` for any service that touches the tenant.

### 4.2 Authentication — migrating to Supabase Auth (in progress)

**Target state (currently uncommitted work in the tree — treat as the direction to build toward):**

1. Frontend authenticates against **Supabase Auth** via `@supabase/ssr`
   (`src/lib/supabase/client.ts` for browser, `server.ts` for RSC/route handlers).
2. The axios request interceptor pulls `session.access_token` from Supabase and sends it as
   `Authorization: Bearer <token>`. A 401 triggers `supabase.auth.signOut()` + redirect to `/login`.
3. `JwtTokenProvider` verifies the Supabase HS256 JWT using `SUPABASE_JWT_SECRET`.
4. `JwtAuthenticationFilter` extracts `sub` (Supabase user UUID) and `email`, then does
   **JIT user provisioning**: find by `supabaseId` → else link an existing row by `email` → else
   create a new `User`. Then builds a `UserPrincipal` and sets the `SecurityContext`.
5. `users.supabase_id` (UUID, unique) added in `V016`; `password_hash` is now nullable.

**Removed as part of this migration:** `AuthController`, `AuthService`, `CustomUserDetailsService`
and their tests. Do not reintroduce local password login.

**Leftovers to clean up when you touch auth** (they are inert but misleading): `SecurityConfig` still
permits `/api/v1/auth/**` and still declares `PasswordEncoder`/`AuthenticationManager` beans;
`application.yml` still carries `app.security.jwt.*`; `RateLimitInterceptor` still has login/register/
refresh buckets for routes that no longer exist.

### 4.3 Authorization — per-organization roles

- Roles are **not** global. `UserPrincipal.getAuthorities()` is intentionally empty.
- Membership + role lives in `UserOrgRole (userId, organizationId, role)`.
- Enforce with SpEL against the `tenantSecurity` bean:

```java
@PreAuthorize("@tenantSecurity.hasRole('ADMIN')")   // ADMIN or higher
@PreAuthorize("@tenantSecurity.isMember()")          // any role in the current org
```

- Hierarchy (most → least privileged): `OWNER > ADMIN > MANAGER > USER > VIEWER`.
  `hasRole(X)` returns true when the user's level is **at least** X.
- `@EnableMethodSecurity` is on. **New controllers should carry `@PreAuthorize` on every endpoint** —
  today only `CollectionController`, `TeamController`, and `NotificationController` do, which means
  most endpoints are merely "authenticated". Closing that gap is expected for any endpoint you add.

### 4.4 Entity design

- Every entity extends `BaseEntity`: `createdAt`, `updatedAt` (Spring Data auditing via
  `AuditingEntityListener`), and `deletedAt`. Timestamps are `OffsetDateTime`.
- IDs: `@Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;` (declared on the
  entity, not on `BaseEntity`).
- **Soft delete** on business aggregates:

```java
@SQLDelete(sql = "UPDATE sales_invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
```

  Append-only / ledger-style tables intentionally skip this: `AuditLog`, `StockMovement`,
  `Notification`, `NumberingSequence`, `UserOrgRole`, all `*Line` children, and the whole
  `Collection*` / `SettlementDeposit` family.
- Lombok on entities: `@Getter @Setter` (the codebase does **not** use `@Data`/`@Builder` on
  entities — `@Data` breaks JPA equals/hashCode on lazy proxies).
- Bidirectional collections get an `addX()` helper that sets both sides:

```java
public void addLine(SalesInvoiceLine line) { lines.add(line); line.setSalesInvoice(this); }
```

- Money is always `BigDecimal`, defaulted to `BigDecimal.ZERO`. Enums are `@Enumerated(EnumType.STRING)`.
- `spring.jpa.hibernate.ddl-auto=validate` — the schema comes from Flyway only. If the entity and the
  migration disagree, the app **fails at startup**. Always ship the migration with the entity change.

### 4.5 Document numbering

Never generate invoice/order numbers inline. Use `SequenceGeneratorService.getNextDocumentNumber(DocumentType)`,
which reads/creates a per-org `NumberingSequence` and formats `prefix + zero-padded number`
(`INV-0001`, `PO-0001`, `QT-`, `SO-`, `PB-`, `JE-`). Adding a document type means adding a case to
`createDefaultSequence`.

### 4.6 GST / tax logic

Intra-state vs inter-state is decided by comparing `organization.state` to the counterparty's billing
state (case-insensitive). Intra-state splits tax into equal `cgstAmount` + `sgstAmount`; inter-state
puts the whole amount in `igstAmount`. Line totals, `subtotal`, `taxTotal`, `totalAmount` are all
computed server-side in the service — never trust client-supplied totals. See
`SalesInvoiceService.createSalesInvoice` as the reference implementation, and `generateEInvoiceJson`
for the IRP e-invoice payload shape.

### 4.7 Rate limiting

`RateLimitInterceptor` (registered in `WebMvcConfig`) classifies each request by path and applies a
Bucket4j bandwidth keyed by IP, user ID, or tenant. Swagger and actuator are exempt. Exceeding a
bucket returns `429` with `X-Rate-Limit-Retry-After-Seconds`. Adding a new expensive endpoint (report,
export, AI call) means adding a bucket in `determineLimit`.

### 4.8 Auditing

`AuditLogService.logAction(entityType, entityId, action, details)` writes an org-scoped `AuditLog`.
Call it from services on state-changing operations. (`userId` is currently not populated — a TODO in
that class; if you wire it, pull the id off `UserPrincipal`.)

---

## 5. Development Commands

The `Makefile` is the canonical entry point and is written for Windows (`mvnw.cmd`, `cmd /c`).

```powershell
make install          # frontend pnpm install + ai venv + backend dependency:resolve
make build            # backend package + frontend build
make test             # backend + ai tests (frontend has no test runner yet)
make format           # spotless:apply + eslint --fix + ruff format
make review           # code-review-graph: architecture + dead-code report

make backend-run      # mvnw.cmd spring-boot:run  (opens Swagger UI)
make frontend-run     # pnpm dev                  (opens localhost:3000)
make ai-run           # uvicorn app.main:app --reload
```

Direct equivalents:

```powershell
# Backend (from /backend)
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
.\mvnw.cmd test -Dtest=SalesInvoiceServiceTest
.\mvnw.cmd spotless:apply

# Frontend (from /frontend)
pnpm dev | pnpm build | pnpm lint
pnpm tsc --noEmit          # CI runs this — run it before you claim a change compiles

# AI service (from /ai-service)
.\.venv\Scripts\pytest
.\.venv\Scripts\ruff check . ; .\.venv\Scripts\mypy .

# Infra (from root)
docker-compose up -d       # redis:6379, prometheus:9090, grafana:3001
```

### Environment / secrets

- Backend reads `.env` at `backend/.env` via `spring-dotenv` (`spring.config.import: optional:file:.env`).
  Keys in use: `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`, `SUPABASE_JWT_SECRET`,
  `SPRING_REDIS_HOST/PORT/PASSWORD`, Resend API key.
- Frontend needs `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Never commit real secrets.** `application.yml` holds only dev-safe defaults; keep it that way.

---

## 6. Coding Conventions

### 6.1 Backend layering

`Controller (thin) → Service (@Transactional, all business logic) → Repository`.
Controllers must not contain business logic; services must not return entities to controllers —
return DTOs mapped by MapStruct.

### 6.2 Controllers

```java
@RestController
@RequestMapping("/api/v1/sales-invoices")   // always /api/v1/<kebab-plural>
@RequiredArgsConstructor
public class SalesInvoiceController {
    private final SalesInvoiceService salesInvoiceService;

    @GetMapping                       // list
    @PostMapping                      // create → 201 CREATED
    @GetMapping("/{id}")              // read
    @PostMapping("/{id}/issue")       // state transitions as sub-resource actions
}
```

Return `ResponseEntity<T>`. Use `@Valid @RequestBody` on write endpoints. Constructor injection via
`@RequiredArgsConstructor` only — never field `@Autowired`.

### 6.3 Services

- `@Service @RequiredArgsConstructor`.
- `@Transactional(readOnly = true)` on reads, `@Transactional` on writes — put it on the service
  method, never the controller.
- Import `org.springframework.transaction.annotation.Transactional` (not the jakarta one).

### 6.4 DTOs

Lombok `@Data` classes in `com.billos.api.dto`, named `<Entity>Dto`. Collections initialised inline
(`= new ArrayList<>()`). Small request payloads may be records (`InviteUserRequest`,
`UpdateRoleRequest`). Note: the PRDs say "prefer records"; the codebase overwhelmingly uses `@Data`
classes because MapStruct + partial updates are simpler that way. **Match the surrounding code** —
`@Data` for entity DTOs, records for small request bodies.

### 6.5 Mappers

```java
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SalesInvoiceMapper {
    @Mapping(source = "customer.id",   target = "customerId")
    @Mapping(source = "customer.name", target = "customerName")
    SalesInvoiceDto toDto(SalesInvoice e);

    @Mapping(target = "customer", ignore = true)   // relations resolved in the service
    @Mapping(target = "lines",    ignore = true)
    SalesInvoice toEntity(SalesInvoiceDto dto);
}
```

Never hand-write entity↔DTO mapping. Relations and totals are resolved in the service, not the mapper.

### 6.6 Flyway migrations

- `V{nnn}__{snake_case_description}.sql`, zero-padded to three digits. Next free number: **V017**.
- **Immutable once committed.** Fix forward with a new migration; never edit an applied one.
- Every org-scoped table needs `organization_id UUID NOT NULL` plus an index, and the
  `created_at / updated_at / deleted_at` columns `BaseEntity` expects.
- Run the backend after adding one — `ddl-auto: validate` is your schema test.

### 6.7 Frontend structure

```
src/app/(dashboard)/customers/page.tsx        →  thin: renders <CustomerList/>
src/features/customers/components/customer-list.tsx   ← the actual UI
src/features/collections/hooks/use-collections.ts     ← typed query/mutation hooks
```

- Route files under `app/` stay a handful of lines and delegate into `src/features/<domain>/`.
- **File naming: kebab-case** (`customer-list.tsx`, `use-collections.ts`). Some older files use
  PascalCase colocated in `app/**/_components/` (e.g. `CustomerForm.tsx`) — that's legacy; new code
  goes in `src/features/`.
- Exported React components are named exports in PascalCase.
- `"use client"` on anything using hooks, state, or the api client.

### 6.8 Frontend data fetching — the standard

`src/features/collections/hooks/use-collections.ts` is the reference. Prefer a typed hooks module per
feature over inline `useQuery` with `any`:

```ts
export interface Customer { id: string; name: string; /* … */ }

export function useCustomers() {
  return useQuery<Customer[]>({ queryKey: ["customers"], queryFn: () => api.get("/customers") });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) => api.post<Customer>("/customers", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
```

- Always use the `api` helper from `@/lib/api-client` — it attaches the bearer token and
  `X-Organization-Id` and unwraps `response.data`. Never call `fetch`/raw `axios` against the API.
- `queryKey` = stable array starting with the resource name. Invalidate every key a mutation affects
  (see `useVerifyPayment`, which invalidates payments, dashboard, ledger, and notifications).
- Query defaults live in `query-provider.tsx` (`staleTime` 60s, no refetch-on-focus, retry 1).
- URL-persisted state uses `nuqs` `useQueryState`, not `useState` + manual router pushes.
- PDFs: `downloadPdf(endpoint, filename)` from `@/lib/api-client`.
- Avoid `any`. Several existing list components use `any[]` — do not copy that; type new code.

### 6.9 Frontend styling

- Tailwind CSS 4 utility classes; theme tokens (`bg-card`, `text-muted-foreground`, `border`) rather
  than raw colours, so dark mode via `next-themes` keeps working.
- Add primitives with the shadcn CLI (`pnpm dlx shadcn@latest add <component>`) into
  `components/ui/`; they are built on `@base-ui/react`, **not** Radix — check Base UI's API when
  adapting examples found online.
- Toasts via `sonner`. Icons via `lucide-react`.
- React 19: no `forwardRef` needed (`ref` is a normal prop); no `React.FC`.

### 6.10 AI service

- Strict `mypy` and `ruff`, line length 100, target py312.
- Pydantic v2 models for every request/response; annotate return types (strict mode enforces it).
- Routes get explicit `response_model` and `tags`.

---

## 7. Testing Rules

> **Core rule: every new or modified backend service ships with unit tests in the same change.**

### What exists today

| Suite | Status |
|---|---|
| Backend (JUnit 5 + Mockito + AssertJ) | **17 test classes**, services + tenant + security. This is the enforced suite. |
| AI service (pytest) | `tests/test_main.py` only — health endpoint. |
| Frontend | **No test runner installed.** `pnpm test` does not exist. |

CI (`.github/workflows/ci.yml`) runs: frontend `pnpm lint` → `tsc --noEmit` → `next build`, backend
`mvnw compile` + `mvnw test`, ai-service `pytest`, then `code-review-graph` and a Trivy filesystem
scan (non-blocking).

### Backend test conventions

**Location:** `backend/src/test/java/com/billos/api/…` mirroring the main package.

```java
@ExtendWith(MockitoExtension.class)
class SalesInvoiceServiceTest {

    @Mock private SalesInvoiceRepository salesInvoiceRepository;
    @Mock private SalesInvoiceMapper     salesInvoiceMapper;
    @InjectMocks private SalesInvoiceService salesInvoiceService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());  // required for tenant-aware services
    }

    @Test
    void shouldReturnInvoice_whenIdExists() {
        // Arrange … Act … Assert
        assertThat(result.getInvoiceNumber()).isEqualTo("INV-0001");
        verify(salesInvoiceRepository).findById(id);
    }
}
```

- Unit tests only — no Spring context, no database.
- Prefer `should{Behavior}_when{Condition}()` naming; some existing tests use
  `method_expectation()` (e.g. `createSalesInvoice_updatesInventory_OUT`). Either reads fine; be
  consistent within a file.
- AssertJ `assertThat(...)`, not raw JUnit assertions.
- Cover: happy path, not-found, invalid state transitions, and tenant scoping.
- Bug fix → add the regression test first, then fix.

### Frontend / AI tests

- Before writing the first frontend test you must add Vitest + React Testing Library and a `test`
  script (they are not installed). Until then, `pnpm tsc --noEmit` + `pnpm build` is the gate.
- Co-locate frontend tests as `*.test.ts(x)`; query by role/label; mock the api client with `vi.mock`.
- AI service: `pytest` + `httpx.AsyncClient`, `@pytest.mark.parametrize` for input variations.

---

## 8. Recipe: adding a full backend resource

1. **Migration** — `V0nn__create_widgets_table.sql`: UUID PK, `organization_id UUID NOT NULL` + index,
   `created_at/updated_at NOT NULL`, `deleted_at NULL`.
2. **Entity** — extends `BaseEntity`, `@TenantId` on `organizationId` (top-level only), `@SQLDelete` +
   `@SQLRestriction`, `@Getter @Setter`, `BigDecimal` money.
3. **Repository** — `extends JpaRepository<Widget, UUID>`; derived queries are auto-tenant-filtered.
4. **DTO** — `WidgetDto` (`@Data`) in `dto/`.
5. **Mapper** — `@Mapper(componentModel = "spring", unmappedTargetPolicy = IGNORE)`.
6. **Service** — `@RequiredArgsConstructor`, `@Transactional` boundaries, resolve relations by id,
   compute totals server-side, `SequenceGeneratorService` for document numbers,
   `AuditLogService.logAction` on writes.
7. **Controller** — `/api/v1/widgets`, `@Valid` on bodies, `@PreAuthorize` on every method.
8. **Test** — `WidgetServiceTest` with `TenantContext` seeded in `@BeforeEach`.
9. **Frontend** — `src/features/widgets/hooks/use-widgets.ts` (typed hooks) +
   `components/widget-list.tsx`, and a thin `app/(dashboard)/widgets/page.tsx`.
10. **Rate limit** — add a bucket in `RateLimitInterceptor.determineLimit` if the endpoint is expensive.
11. Run `make backend-test`, `pnpm tsc --noEmit`, and start the backend once to satisfy `ddl-auto: validate`.

---

## 9. Common Pitfalls

1. **Missing `@TenantId`** on a top-level org-scoped entity → cross-tenant data leak. Check §4.1 for
   which entities legitimately omit it.
2. **Entity/migration drift** — `ddl-auto: validate` fails startup. Ship both together.
3. **Editing an applied Flyway migration** — never. New file, next number.
4. **npm instead of pnpm** — the repo uses pnpm; an accidental `frontend/package-lock.json` exists and
   should be removed, not maintained.
5. **Hand-formatting Java** — Spotless (palantir) rewrites it on `process-sources`; run
   `make backend-format` instead of fighting the diff.
6. **Assuming Radix** — `components/ui/*` sits on `@base-ui/react`. Radix-specific props/patterns
   won't compile.
7. **Assuming a frontend test runner exists** — it doesn't yet.
8. **`spring.redis.*` vs `spring.data.redis.*`** — `application.yml` uses the legacy `spring.redis.*`
   prefix, which Boot 3 ignores; Redis currently resolves to localhost defaults. Fix the prefix if you
   need non-default Redis config.
9. **Assuming actuator metrics work** — `spring-boot-starter-actuator` is not a dependency and
   `prometheus.yml` only scrapes Prometheus itself, despite `SecurityConfig` permitting `/actuator/**`.
10. **ThreadLocal tenant across async boundaries** — propagate explicitly.
11. **React 19 / Next 16 are very new** — verify library compatibility before adding a dependency.

---

## 10. Known Gaps & Tech Debt

Documented so you don't mistake them for patterns to copy. Fixing one is welcome; do it as a scoped
change and update this list.

- **No global exception handling.** There is no `@ControllerAdvice`; services throw bare
  `new RuntimeException("… not found")`, which surfaces as HTTP 500. New code should ideally throw a
  typed exception; a `GlobalExceptionHandler` mapping to 404/400/409 is the highest-value backend fix.
- **Validation is nearly absent** — only `TeamController` uses `@Valid`, and DTOs carry no
  `jakarta.validation` constraints.
- **Authorization coverage** — only 3 of 24 controllers use `@PreAuthorize`.
- **`TenantContext.getCurrentTenant()` is dereferenced without a null check** in many services
  (`UUID.fromString(null)` → NPE) when the `X-Organization-Id` header is missing.
- **No JaCoCo** — the "≥80% coverage" target in the PRDs is aspirational, not enforced.
- **No frontend test infrastructure.**
- **Duplicate/legacy routes**: `settings/tax` vs `settings/taxes`; `reports/gst` vs
  `reports/gstr1`/`gstr3b`. Consolidate when you touch them.
- **`any` types** in several list components (`customer-list.tsx`, `product-list.tsx`, …).
- **Auth migration leftovers** — see §4.2.
- **`AuditLog.userId` never populated.**
- **`code-review.md` baseline**: `ui-dropdown` is flagged as a god-component with heavy coupling, and
  ~234 symbols read as dead code (mostly unused DTOs/enums).

---

## 11. Documentation Reference

`/docs` holds 18 PRDs. Consult before architectural decisions — but remember they describe **intent**;
this file describes **implementation**.

| Doc | Use it for |
|---|---|
| `06-system-architecture.md` | Full intended architecture |
| `08-database-design.md` | Schema design rationale |
| `09-api-documentation.md` | API contract intent |
| `11-security.md` | Security requirements |
| `12-best-practices.md` / `17-coding-standards.md` | Standards |
| `13-testing-strategy.md` | Test strategy incl. prompt regression tests |
| `14-ci-cd.md` / `15-deployment-guide.md` | Pipeline and deploy |
| `18-performance-targets.md` | Latency/throughput budgets |
| `code-review.md` | `code-review-graph` workflow + baseline findings |

---

## Keeping this file current

Update CLAUDE.md **in the same commit** as the change when you:

- add or remove a service, controller, feature module, or infrastructure component;
- change an architectural pattern (tenancy, auth, error handling, data fetching);
- add/change a build, test, or run command, or a required env var;
- upgrade a major dependency or swap a library;
- close an item in §10 (delete it) or discover a new systemic gap (add it);
- bump the "next free Flyway number" in §6.6.

Keep it factual and verified against the code. If you cannot confirm a claim by reading the source,
either verify it or mark it explicitly as intent.
