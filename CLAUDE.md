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
| Backend        | Spring Boot                         | 3.5.16, Java 25                                        |
| ORM            | Hibernate 6 (Spring Data JPA)       | Discriminator multi-tenancy via `@TenantId`            |
| Auth (current) | Supabase Auth (GoTrue) + JWT verify | Spring OAuth2 resource server; ES256 via Supabase JWKS |
| Migrations     | Flyway                              | `backend/src/main/resources/db/migration/` (V001–V024) |
| Mapping        | MapStruct 1.5.5.Final               | `componentModel = "spring"`, unmapped targets IGNOREd  |
| PDF            | openhtmltopdf 1.0.10 + Thymeleaf    | HTML templates → PDF                                   |
| AOP            | spring-boot-starter-aop             | `@Audited` → `AuditAspect` (§4.8)                      |
| Rate limiting  | Bucket4j 8.10.1 + Redis             | `RateLimitInterceptor` (per-IP / per-user / per-tenant)|
| Java format    | Spotless + palantir-java-format     | Auto-applies on `process-sources` — **do not hand-format** |
| API docs       | SpringDoc OpenAPI 2.5.0             | `/swagger-ui/index.html`                               |
| Frontend       | Next.js App Router                  | 16.2.10, React 19.2.4                                  |
| Data fetching  | TanStack Query v5 + axios           | `apiClient` interceptors in `src/lib/api-client.ts`    |
| URL state      | nuqs 2                              | `NuqsAdapter` in `src/providers/query-provider.tsx`    |
| UI primitives  | **@base-ui/react** 1.6 + shadcn 4   | Base UI, *not* Radix. Components in `components/ui/`   |
| Styling        | Tailwind CSS 4                      | PostCSS pipeline, `tw-animate-css`, `next-themes`      |
| Icons / toasts | lucide-react / sonner               |                                                        |
| Motion         | motion 12 (`motion/react`)          | Marketing site only; `LazyMotion` + `m` (§6.10). Never `framer-motion` |
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
│       ├── controller/               # 26 REST controllers, all under /api/v1/**
│       ├── dto/                      # Lombok @Data DTOs (not records — see §6.4)
│       ├── entity/                   # JPA entities + status/type enums
│       ├── mapper/                   # MapStruct interfaces
│       ├── repository/               # Spring Data JPA repositories
│       ├── security/                 # SecurityConfig, SupabaseJwtAuthenticationConverter, TenantSecurity,
│       │                             #   TenantMembershipInterceptor, UserPrincipal, RateLimitInterceptor/Service
│       ├── service/                  # Business logic
│       └── tenant/                   # TenantContext, TenantFilter, TenantIdentifierResolver
│   └── src/main/resources/
│       ├── application.yml
│       ├── db/migration/             # Flyway V001..V024
│       └── templates/                # invoice/po/quotation HTML → PDF
├── frontend/                         # Next.js (pnpm)
│   └── src/
│       ├── app/
│       │   ├── (auth)/               # login, register, forgot/reset/change-password
│       │   ├── (dashboard)/          # thin route pages → delegate to src/features/*
│       │   ├── (landing)/            # marketing + legal pages
│       │   ├── (onboarding)/setup/   # org creation
│       │   └── accept-invite/
│       ├── components/
│       │   ├── ui/                   # shadcn/Base UI primitives — do not hand-edit casually
│       │   ├── layout/ settings/ team/
│       ├── features/<domain>/        # components/ + hooks/  ← the real feature code lives here
│       │   └── marketing/            # public website: tokens-driven components, content/, motion setup
│       ├── lib/                      # api-client, config, use-organization, utils, supabase/
│       └── providers/query-provider.tsx
├── ai-service/                       # FastAPI (stub)
├── docs/                             # 18 PRDs + code-review.md
├── design-system/billos/MASTER.md    # marketing-site design system (UI UX Pro Max format)
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
- **Membership is enforced centrally.** `TenantMembershipInterceptor` (registered in `WebMvcConfig`, after
  Spring Security) rejects every tenant-scoped `/api/**` request whose `X-Organization-Id` the caller does
  not belong to (403), or that has no/invalid header (400). Tenant-agnostic prefixes are `/public`,
  `/health`, `/users`, `/organizations` — endpoints there address orgs by path and must check access
  themselves (e.g. `@PreAuthorize("@tenantSecurity.hasRoleIn(#id, 'ADMIN')")`). If you add a new
  tenant-agnostic route family, add it to both `TENANT_AGNOSTIC_PREFIXES` (backend) and the same list in
  `frontend/src/lib/api-client.ts`.

**Rules for new code:**

| Entity kind | `@TenantId` on `organizationId`? |
|---|---|
| Top-level org-scoped aggregate (`SalesInvoice`, `Product`, `Customer`, …) | **Yes, required** |
| Child/line entity reached only via its parent (`SalesInvoiceLine`, `PurchaseOrderLine`, `JournalEntryLine`, `PaymentAllocation`) | No — no `organization_id` column; isolation comes from the parent |
| Global entities (`User`, `Organization`, `UserOrgRole`) | No — query `UserOrgRole` with `findByOrganizationId`, **never `findAll()`** |
| Branch-shareable masters: `Customer`, `Product`, `CollectionQrCode` | **No `@TenantId`** (V020, so a branch can see the parent's `isShared` records). Hibernate does **not** scope them: resolve by id via `SharedEntityResolver` (`accessibleCustomer/Product/QrCode`, `isOwnedByCurrentOrg`) and list via `findByOrganizationId`/`findAccessible*`. A plain `findById`/`findAll` crosses tenants. Edits/deletes only on records the current org owns. |
| `OrganizationSettings`, `OrganizationInvitation` | Currently **plain `organizationId` column, no `@TenantId`** — you must filter by org explicitly in the repository/service. Treat this as a known inconsistency, not a template. |

- Never write a cross-tenant query without an explicit, commented justification.
- In services, read the tenant with `UUID.fromString(TenantContext.getCurrentTenant())` (this is the
  established idiom — but see [Known Gaps](#known-gaps--tech-debt) about the missing null guard).
- Unit tests **must** call `TenantContext.setCurrentTenant(UUID.randomUUID().toString())` in
  `@BeforeEach` for any service that touches the tenant.

### 4.2 Authentication — Supabase Auth

1. Frontend authenticates against **Supabase Auth** via `@supabase/ssr`
   (`src/lib/supabase/client.ts` for browser, `server.ts` for RSC/route handlers). `src/proxy.ts` (Next 16's
   middleware) refreshes the session and is fail-closed: routes not in `PUBLIC_ROUTES` need a session.
2. The axios request interceptor pulls `session.access_token` from Supabase and sends it as
   `Authorization: Bearer <token>`. A 401 triggers `supabase.auth.signOut()` + redirect to `/login`.
3. The backend is a Spring **OAuth2 resource server**: it verifies Supabase's **ES256** tokens against the
   JWKS at `SUPABASE_JWKS_URL` (`application.yml` → `spring.security.oauth2.resourceserver.jwt`).
4. `SupabaseJwtAuthenticationConverter` requires `role=authenticated`, a UUID `sub` and an `email`, then
   **JIT-provisions** the local user via `SupabaseUserProvisioningService` (find by `supabaseId` → link by
   email → create). Consequence: *any* authenticated request creates a local user — which is why
   `POST /public/check-user-exists` (used by the OAuth callback to block unknown Google logins) is public and
   takes the access token in the body, verifying it with `JwtDecoder` and answering only for its own email.
5. Password reset: `/forgot-password` → `supabase.auth.resetPasswordForEmail` → `/reset-password` (the browser
   client exchanges the recovery code). The `/reset-password` URL must be in Supabase's allowed Redirect URLs.
   Owner-created members get a temporary password and `users.must_change_password` → `/change-password`.

There is no local password login, `PasswordEncoder` or `AuthenticationManager`; do not reintroduce them.

### 4.3 Authorization — per-organization roles

- Roles are **not** global. `UserPrincipal.getAuthorities()` is intentionally empty.
- Membership + role lives in `UserOrgRole (userId, organizationId, role)`.
- Enforce with SpEL against the `tenantSecurity` bean:

```java
@PreAuthorize("@tenantSecurity.hasRole('ADMIN')")          // ADMIN or higher in the X-Organization-Id org
@PreAuthorize("@tenantSecurity.isMember()")                 // any role in the current org
@PreAuthorize("@tenantSecurity.hasRoleIn(#id, 'ADMIN')")   // /organizations/{id}/** (tenant-agnostic paths)
```

- Hierarchy (most → least privileged): `OWNER > ADMIN > MANAGER > USER > VIEWER`.
  `hasRole(X)` returns true when the user's level is **at least** X.
- A role in a parent organization is inherited by its branches (`TenantSecurity.resolveEffectiveRole`).
- `@EnableMethodSecurity` is on. **Every endpoint of a tenant-scoped controller declares its minimum role**
  with `@PreAuthorize`; `ControllerAuthorizationTest` fails the build if one is missing, if a write is open to
  bare membership, or if a DELETE is allowed below MANAGER. The policy:

  | Action | Minimum role |
  |---|---|
  | Reads (lists, details, PDFs, reports, dashboard) | `isMember()` (VIEWER) |
  | Create/update day-to-day records (customers, products, categories, suppliers, quotes, orders, invoices, POs, bills, payments, stock adjustments, bulk imports, issue actions) | `USER` |
  | Delete master data; create/edit warehouses; post journal entries | `MANAGER` |
  | Chart of accounts, tax rates, organization settings/details, audit logs | `ADMIN` |

  Collections writes (record payment/expense/deposit, verify payment) need `USER`, so VIEWER stays strictly
  read-only; `CollectionService.verifyPayment` narrows verification further to the QR code's owner, OWNER or
  ADMIN. The only allow-listed member-level write is `markAsRead` on notifications.
  Self-service controllers (`Health`, `Public`, `User`) and org-self-service methods are exempt.
- `TenantSecurity` memoizes the resolved role per request, so the membership interceptor plus several
  `@PreAuthorize` checks cost one role lookup.

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
computed server-side in the service — never trust client-supplied totals. All amounts go through
`TaxMath` (2 dp, HALF_UP; SGST = tax − CGST so the halves always sum exactly). See
`SalesInvoiceService.createSalesInvoice` as the reference implementation, and `generateEInvoiceJson`
for the IRP e-invoice payload shape.

### 4.6.1 Invoice / payment lifecycle

- A new invoice may only be `DRAFT` or `ISSUED`. Becoming ISSUED (at create or via `POST /{id}/issue`) runs
  `postIssuedInvoice`: deduct stock per line and add the total to `customer.outstandingBalance`.
- `sales_invoices.amount_paid` / `purchase_bills.amount_paid` (V024) accumulate allocations. `PaymentService`
  accepts payments only against ISSUED/PARTIAL invoices and UNPAID/PARTIAL bills, rejects allocations above
  the remaining balance or the payment amount, and sets PARTIAL/PAID from the running total.
- A purchase order can be billed once: BILLED/CANCELLED POs are refused, and the bill's supplier must match.
- **Stock movements carry their direction in the type**: `IN` adds and `OUT` removes the absolute quantity;
  `ADJUSTMENT`/`TRANSFER` are signed (see `InventoryService.signedDelta`). Negative stock is allowed.
- **`products.base_price` is the selling price and is only changed by users.** Weighted average purchase cost
  lives in `products.cost_price` (V025), updated from valuation movements (purchase bills, opening stock) and
  averaged over stock in all of the org's warehouses. Clients can't set it (`ProductMapper` ignores it).
- GST returns (GSTR-1/3B, HSN summary), the sales register and P&L count only issued invoices — never DRAFT or
  VOID (`ReportService.isReportableInvoice`). P&L is on taxable value (subtotal), excluding GST.
- Document numbers come from `SequenceGeneratorService.getNextDocumentNumber`, which row-locks the sequence
  (`NumberingSequenceRepository.findForUpdate`) so concurrent documents never share a number.
- Tax rates in use on any document can be renamed or deactivated but not re-priced or deleted
  (`TaxRateRepository.isUsedOnDocuments`); accounts with journal lines or sub-accounts can't be deleted.

### 4.7 Rate limiting

`RateLimitInterceptor` (registered in `WebMvcConfig`) classifies each request by path and applies a
Bucket4j bandwidth keyed by IP, user ID, or tenant. Swagger and actuator are exempt. Exceeding a
bucket returns `429` with `X-Rate-Limit-Retry-After-Seconds`. Adding a new expensive endpoint (report,
export, AI call) means adding a bucket in `determineLimit`.

The client IP is `request.getRemoteAddr()` — **never read `X-Forwarded-For` yourself** (its left-most entry is
client-controlled). `server.forward-headers-strategy: native` makes Tomcat's RemoteIpValve resolve the real
client by walking the header right-to-left through trusted proxies (private/loopback ranges by default, which
covers Render's load balancer). If a public CDN is put in front, set `SERVER_TOMCAT_REMOTEIP_TRUSTED_PROXIES`
to its ranges, or every client will share the CDN's IP bucket.

### 4.8 Auditing

Annotate state-changing methods with **`@Audited(entity = "SalesInvoice", action = "ISSUE")`** — don't call
`AuditLogService` by hand. `AuditAspect` records org, acting user, entity id (the result's `getId()`, else the
first `UUID` argument) and a label from an allow-list of getters (document number, name, email) **after the
transaction commits**, in its own transaction, and never fails the business operation. Keep secrets out of
results or off that allow-list. Put it on the entry point only (e.g. `InventoryController.adjustStock`, not
`InventoryService.adjustStock`, which also runs per invoice line). All ~50 mutating service methods carry it.

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
  Keys in use: `SPRING_DATASOURCE_URL/USERNAME/PASSWORD`, `SUPABASE_URL`, `SUPABASE_JWKS_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, `APP_FRONTEND_URL`, `SPRING_REDIS_HOST/PORT/PASSWORD`.
  Log levels default to INFO; raise with `LOG_LEVEL_SECURITY`, `LOG_LEVEL_CORS`, `LOG_LEVEL_APP` locally.
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
- **Throw typed exceptions** from `com.billos.api.exception` — `ResourceNotFoundException` (404),
  `BadRequestException` (400), `ConflictException` (409, e.g. already processed / last owner),
  `ForbiddenException` (403, e.g. branch editing parent data). `GlobalExceptionHandler` returns
  `{status, error, message, path, timestamp, fieldErrors?}` and the frontend shows `message`, so write it for
  users. Anything else (a bare `RuntimeException`) becomes a generic 500 and is logged with its stack trace —
  reserve that for genuine internal failures (PDF rendering, Supabase admin calls).

### 6.4 DTOs

Lombok `@Data` classes in `com.billos.api.dto`, named `<Entity>Dto`. Collections initialised inline
(`= new ArrayList<>()`). Small request payloads may be records (`InviteUserRequest`,
`UpdateRoleRequest`). Note: the PRDs say "prefer records"; the codebase overwhelmingly uses `@Data`
classes because MapStruct + partial updates are simpler that way. **Match the surrounding code** —
`@Data` for entity DTOs, records for small request bodies.

**Never declare a primitive `boolean isX` in a `@Data` DTO without pinning its JSON name.** Lombok generates
`isX()`/`setX()`, which Jackson exposes as `"x"` — so the frontend's `"isX"` is silently ignored (this made tax
rates, warehouses and accounts save as inactive; fixed in V026). Either use `Boolean isX` (→ `getIsX()`, JSON
`"isX"`) or annotate the field `@Getter(onMethod_ = @JsonProperty("isX")) @Setter(onMethod_ = @JsonProperty("isX"))`
as `TaxRateDto` does.

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

- `V{nnn}__{snake_case_description}.sql`, zero-padded to three digits. Next free number: **V027**.
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
- **Next 16: `params`/`searchParams` are Promises.** In a dynamic route use
  `async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; }`
  (or `use(params)` in a client component). Reading `params.id` directly yields `undefined`, and TypeScript
  will not catch it if you hand-type `params`.

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
- The active org lives in `localStorage.active_org_id`; `api-client` resolves it (first org) when missing and
  clears it when the backend answers 403 for a stale org. In components get the active org from
  `useOrganization()` — **never `orgs[0]`** from `/organizations`, which is wrong for branch users.
- Failed calls reject with `ApiError` (`message` is already the backend's message; `status`/`response`
  kept). `toast.error(error.message)` is enough.
- `queryKey` = stable array starting with the resource name. Invalidate every key a mutation affects
  (see `useVerifyPayment`, which invalidates payments, dashboard, ledger, and notifications).
- Query defaults live in `query-provider.tsx` (`staleTime` 60s, no refetch-on-focus, retry 1).
- URL-persisted state uses `nuqs` `useQueryState`, not `useState` + manual router pushes.
- PDFs: `downloadPdf(endpoint, filename)` from `@/lib/api-client`.
- No `any` — the codebase is warning-free and CI runs ESLint with `--max-warnings 0`. Type API responses with
  `@/types` (`api.get<Product[]>(...)`) and let callbacks infer; use `errorMessage(err, fallback)` from
  `@/lib/api-client` for `catch (err: unknown)`.
- Don't copy fetched data into form state with `useEffect`; use the render-time sync pattern
  (`if (data && data !== synced) { setSynced(data); setForm(...) }`) — see `CustomerForm`, or derive the value.
- **Display formatting goes through `useFormat()`** (`@/lib/use-format`): `formatMoney`, `formatMoneyCompact`,
  `formatNumber`, `formatDate`, `formatDateTime`, `formatLongDate`. They follow Settings → Preferences (number
  format en-IN/en-US, time zone, date format; `FormatPreferencesProvider` in the dashboard layout). Never
  hard-code `toFixed(2)`, `toLocaleString("en-IN")` or render raw ISO dates. Calendar dates (`invoiceDate`) are
  never time-zone shifted; timestamps are. PDFs apply the date format via `DocumentGenerationService`.
- The signed-in user's display details come from `useCurrentUser()` (`@/lib/use-current-user`).

### 6.9 Frontend styling

- Tailwind CSS 4 utility classes; theme tokens (`bg-card`, `text-muted-foreground`, `border`) rather
  than raw colours, so dark mode via `next-themes` keeps working.
- Add primitives with the shadcn CLI (`pnpm dlx shadcn@latest add <component>`) into
  `components/ui/`; they are built on `@base-ui/react`, **not** Radix — check Base UI's API when
  adapting examples found online.
- Toasts via `sonner`. Icons via `lucide-react`.
- React 19: no `forwardRef` needed (`ref` is a normal prop); no `React.FC`.

### 6.10 Marketing site (`app/(landing)`, `features/marketing/`)

The public website has its own light "Ledger" theme; the spec is `design-system/billos/MASTER.md`.

- **Theme is scoped, not global.** `(landing)/layout.tsx` wraps pages in `.site-light`, which re-points the
  shadcn tokens (`--background`, `--primary`, …) to paper/ink values in `globals.css`. The `dark:` variant
  excludes `.site-light` subtrees (zero specificity, so the dashboard cascade is unchanged). `.tone-inverse`
  inside it gives navy bands/app screenshots. Portaled UI (the mobile menu) must re-apply `site-light`.
- **Use semantic tokens only** (`bg-card`, `text-muted-foreground`, `text-subtle`, `text-link`, `bg-sunken`,
  `text-positive`…) — no raw hex — so components work on both paper and ink.
- **Motion**: import `* as m from "motion/react-m"` (never `motion.*` — `LazyMotion strict` throws) and
  tokens from `motion-tokens.ts`. Animate named transforms (`y`, `scaleX`): `reducedMotion="user"` doesn't
  cover a `transform` string. Above-the-fold entrances use CSS (`animate-rise`), not JS, so they don't wait
  for hydration.
- **Copy must match the product.** `modules.tsx` (tour + /features), `content/plans.ts` (every price) and
  `content/faqs.ts` are single sources; don't list a capability until it ships, and no invented social proof.
- Server components by default; client islands only for interaction (invoice demo, tabs, plans, FAQ, form).
- The contact form composes a `mailto:` (there's no contact endpoint) and says so on the button.

### 6.11 AI service

- Strict `mypy` and `ruff`, line length 100, target py312.
- Pydantic v2 models for every request/response; annotate return types (strict mode enforces it).
- Routes get explicit `response_model` and `tags`.

---

## 7. Testing Rules

> **Core rule: every new or modified backend service ships with unit tests in the same change.**

### What exists today

| Suite | Status |
|---|---|
| Backend (JUnit 5 + Mockito + AssertJ) | **30 test classes / 131 tests**, services + tenant + security + exception handling + auditing + an authorization architecture test. This is the enforced suite. |
| AI service (pytest) | `tests/test_main.py` only — health endpoint. |
| Frontend | **No test runner installed.** `pnpm test` does not exist. |

CI (`.github/workflows/ci.yml`) runs: frontend `pnpm lint --max-warnings 0` → `tsc --noEmit` → `next build`, backend
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
   `@Audited` on every write.
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
12. **`findById`/`findAll` on `Customer`, `Product`, `CollectionQrCode`, `UserOrgRole`** — not tenant-scoped;
    see §4.1.
13. **Stale incremental builds** — if Mockito reports "class redefinition failed … NestHost", run
    `mvnw clean test`; an old `.class` from a previous/IDE compile is mismatched.
14. **`boolean isX` in `@Data` DTOs** — serialises as `"x"`; see §6.4.
15. **Soft-deleting something other rows reference** (accounts, tax rates, …) leaves those rows pointing at a
    hidden record that then fails to load. Guard deletes with a usage check and offer "deactivate" instead.

---

## 10. Known Gaps & Tech Debt

Documented so you don't mistake them for patterns to copy. Fixing one is welcome; do it as a scoped
change and update this list.

- **Validation is nearly absent** — only `TeamController` uses `@Valid`, and DTOs carry no
  `jakarta.validation` constraints.
- **The frontend does not hide actions by role** — a VIEWER still sees Create/Delete buttons and gets a 403
  toast ("Your role in this organization does not allow this action.") when using them.
- **Phone verification is a demo stub** — `/phone` accepts any 6-digit OTP; no SMS provider is wired.
- **Customer/supplier `outstandingBalance` is a single column**, so for a parent's shared customer it mixes
  the parent's and branches' receivables; dashboard/receivables report count only customers the current org owns.
- **No JaCoCo** — the "≥80% coverage" target in the PRDs is aspirational, not enforced.
- **No frontend test infrastructure.**
- **Legacy route**: `settings/tax` only redirects to `settings/taxes`. (`reports/gst` is the HSN summary.)
- **Accounting is not posted from documents** — invoices, bills and payments don't create journal entries;
  the chart of accounts/journal is manual and P&L is computed from invoices/bills, not the ledger.
- **Selling prices may have been overwritten before V025** — purchase bills used to write average cost into
  `base_price`; V025 separated `cost_price` but can't restore lost selling prices. Worth a data review.
- **e-invoice payload (`generateEInvoiceJson`) is partial** — e.g. state names instead of GST state codes.
- **`organization_invitations` table is unused** (the invitation code was removed; the table was kept to
  avoid dropping data).
- **The app is dark-only** (`<html class="dark">`, ~700 hard-coded `slate-*` classes); the no-op theme selector
  was removed. Only the marketing site is light (scoped via `.site-light`, §6.10). The stored `language` setting only selects the number format — there are no UI translations.
- **No UI to void invoices or view a single invoice/order/bill/quotation** (list pages only).
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
