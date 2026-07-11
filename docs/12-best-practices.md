# Chapter 12 — Best Practices

> Back to [Index](./README.md) | Prev ← [Security](./11-security.md) | Next → [Testing Strategy](./13-testing-strategy.md)

---

## 12.1 Frontend Best Practices

### Architecture

| Practice | Rule |
|----------|------|
| **Feature-based structure** | Group by feature (`/features/invoices/`) not by type (`/components/`, `/hooks/`) |
| **Server Components first** | Default to RSC; use `"use client"` only when interactivity is needed |
| **Colocation** | Keep components, hooks, schemas, and types close to where they're used |
| **Barrel exports** | Each feature folder has an `index.ts` re-exporting its public API |

### Components

| Practice | Rule |
|----------|------|
| **Single Responsibility** | One component = one purpose. Split if > 200 lines. |
| **Props interface** | Every component has a typed `Props` interface (not inline) |
| **Default exports** | Page components only. All other components use named exports. |
| **Composition over props** | Prefer `children` and compound components over boolean props (`isLoading`, `hasError`) |
| **shadcn/ui first** | Use shadcn/ui primitives; never build custom buttons, inputs, dialogs from scratch |
| **No prop drilling** | Use Zustand stores or React Context for deeply nested state |

### Hooks

| Practice | Rule |
|----------|------|
| **Custom hooks** | Extract shared logic into `use-*.ts` hooks |
| **TanStack Query** | All server data via `useQuery` / `useMutation` — never `useEffect` for fetching |
| **Zustand** | Only for client-only UI state (sidebar, theme, modals) |
| **URL state** | Filters, pagination, and sort state in URL params (via `nuqs`) |

### Type Safety

| Practice | Rule |
|----------|------|
| **Strict mode** | `tsconfig.json` → `"strict": true` |
| **No `any`** | Zero tolerance. Use `unknown` + type guards instead. |
| **Zod inference** | Derive TypeScript types from Zod schemas: `type Customer = z.infer<typeof customerSchema>` |
| **API client** | Typed request/response via generated or hand-written types |
| **Enums** | Use `as const` objects or string unions, not TypeScript `enum` |

### Performance

| Practice | Rule |
|----------|------|
| **Lazy loading** | Dynamic imports for heavy feature pages: `dynamic(() => import(...))` |
| **Image optimization** | Use `next/image` with proper `width`/`height`/`sizes` |
| **Bundle analysis** | Run `@next/bundle-analyzer` before releases |
| **Memoization** | `useMemo` / `useCallback` only for expensive computations — not by default |
| **Virtualization** | Use `@tanstack/virtual` for lists > 100 items |

---

## 12.2 Backend Best Practices

### Architecture — Layered

```
Controller (thin)
    ↓ calls
Service (business logic)
    ↓ calls
Repository (data access)
    ↓ maps to
Entity (JPA)
```

| Layer | Responsibility | Rules |
|-------|---------------|-------|
| **Controller** | HTTP handling, request validation, response mapping | No business logic. Max 10–15 lines per method. |
| **Service** | Business rules, orchestration, transaction management | Only layer with `@Transactional`. Never directly return entities. |
| **Repository** | Data access via Spring Data JPA | No business logic. Custom queries via `@Query` or Specifications. |
| **Entity** | Database mapping | No business logic. Clean JPA annotations. |
| **DTO** | API contract | Separate Request/Response DTOs. Never expose entities. |
| **Mapper** | Entity ↔ DTO conversion | MapStruct only (compile-time, no reflection). |

### SOLID Principles

| Principle | Application |
|-----------|------------|
| **S — Single Responsibility** | `InvoiceService` handles invoices. `GstCalculationService` handles tax. `PdfGenerationService` handles PDFs. |
| **O — Open/Closed** | New invoice templates via strategy pattern, not if/else chains. |
| **L — Liskov Substitution** | All services implement interfaces; tests use mocks. |
| **I — Interface Segregation** | `Readable<T>`, `Writable<T>` interfaces, not one fat `CrudService<T>`. |
| **D — Dependency Inversion** | Services depend on repository interfaces (not implementations). Constructor injection everywhere. |

### Constructor Injection

```java
@Service
@RequiredArgsConstructor  // Lombok generates constructor
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final CustomerService customerService;
    private final GstCalculationService gstService;
    private final AuditLogService auditLogService;
    // No @Autowired. No field injection. No setter injection.
}
```

### DTO Pattern

```
Client → InvoiceRequest (DTO) → Controller validates → Service receives DTO
→ Mapper converts to Entity → Repository saves → Mapper converts to InvoiceResponse (DTO)
→ Controller returns DTO wrapped in ApiResponse
```

**Rules:**
- Request DTOs: Bean Validation annotations (`@NotBlank`, `@Size`, `@Email`, etc.)
- Response DTOs: No validation annotations. Read-only.
- Never return JPA entities from controllers.
- Separate `InvoiceResponse` (detail) and `InvoiceSummaryResponse` (list view).

### Global Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // Validation errors → 400
    // ResourceNotFoundException → 404
    // DuplicateResourceException → 409
    // BusinessRuleException → 422
    // UnauthorizedException → 401
    // ForbiddenException → 403
    // RateLimitExceededException → 429
    // All others → 500 (logged to Sentry)
}
```

**Every exception returns the standard error format** (see Chapter 6 §6.5).

### Logging

| Level | Usage |
|-------|-------|
| `ERROR` | Unrecoverable errors, exceptions caught at global handler |
| `WARN` | Recoverable issues, rate limit approaches, deprecated API usage |
| `INFO` | Business events (invoice created, payment received) |
| `DEBUG` | Technical details (SQL queries, cache hits/misses) — dev/staging only |
| `TRACE` | Very detailed debugging — never in production |

**Format (Production):** Structured JSON via Logback
```json
{
  "timestamp": "2026-07-10T18:00:00.000Z",
  "level": "INFO",
  "logger": "c.b.a.service.InvoiceService",
  "message": "Invoice created",
  "traceId": "abc-123",
  "orgId": "org-uuid",
  "userId": "user-uuid",
  "invoiceId": "inv-uuid",
  "invoiceNumber": "INV/MUM/2627/00001"
}
```

### Validation

```java
// DTO-level validation
public record CustomerRequest(
    @NotBlank @Size(min = 2, max = 200)
    String displayName,

    @NotNull
    CustomerType customerType,

    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
             message = "Invalid GSTIN format")
    String gstin,

    @Pattern(regexp = "^[0-9]{10}$", message = "Invalid phone number")
    String phone,

    @Email
    String email,

    @Min(0) @Digits(integer = 13, fraction = 2)
    BigDecimal creditLimit
) {}

// Service-level validation (business rules)
public void validateCreditLimit(Customer customer, BigDecimal invoiceAmount) {
    if (customer.getCreditLimit().compareTo(BigDecimal.ZERO) > 0
        && customer.getOutstanding().add(invoiceAmount).compareTo(customer.getCreditLimit()) > 0) {
        throw new BusinessRuleException("CREDIT_LIMIT_EXCEEDED",
            "Invoice would exceed credit limit of ₹" + customer.getCreditLimit());
    }
}
```

---

## 12.3 AI Best Practices

| Practice | Rule |
|----------|------|
| **Prompt Versioning** | All prompts in `/prompts/` directory with version suffix (`_v1.txt`). Track changes in Git. |
| **Prompt Templates** | Use variable placeholders (`{organization_name}`, `{user_role}`) — never hardcode. |
| **Token Optimization** | Count tokens before sending. Truncate conversation history if approaching context window limit. |
| **Retry with Backoff** | Exponential backoff (1s, 2s, 4s, 8s, max 30s) for LLM API failures. Max 3 retries. |
| **Context Window** | Monitor usage. Claude (200K), GPT-4 (128K). Keep under 80% for response room. |
| **Guardrails** | System prompt includes strict boundaries: no PII disclosure, no cross-tenant data, no hallucinated numbers. |
| **Hallucination Mitigation** | Every data response cites source (invoice #, customer name). "I don't know" for uncertain answers. |
| **Structured Output** | Use Pydantic models for output parsing. Validate before returning to user. |
| **Cost Monitoring** | Track tokens per request, cost per user per day. Alert on anomalies. |
| **Model Fallback** | Claude → OpenAI → Gemini. If all fail, return friendly error. |
| **Evaluation** | Maintain a test set of 50+ prompt/expected-response pairs. Run on every prompt version change. |

---

## 12.4 Database Best Practices

| Practice | Rule |
|----------|------|
| **UUID Primary Keys** | `gen_random_uuid()` — never auto-increment integers (multi-tenant security + distributed-friendly) |
| **Soft Deletes** | `deleted_at TIMESTAMP NULL` — never physical DELETE on business data |
| **Optimistic Locking** | `version INTEGER` column + `@Version` annotation — prevents lost updates |
| **Proper Indexing** | Index every column used in WHERE, JOIN, ORDER BY. Composite indexes for multi-column filters. |
| **Flyway Only** | All schema changes via `V{number}__{description}.sql`. Never manual DDL in production. |
| **N+1 Prevention** | Use `@EntityGraph` or `JOIN FETCH` for known associations. Monitor with Hibernate statistics. |
| **Transaction Management** | `@Transactional` only on service methods. Read-only transactions where applicable. |
| **Batch Operations** | Use `saveAll()` with batch size = 50 for bulk inserts. Set `hibernate.jdbc.batch_size=50`. |
| **Timestamps** | Always `TIMESTAMP WITH TIME ZONE`. Store in UTC. Convert in application layer. |
| **Naming** | `snake_case` for tables and columns. Singular table names (`customer`, not `customers`). |
| **No Stored Procedures** | Keep business logic in Java service layer. DB functions only for triggers and computed columns. |
| **Connection Pooling** | HikariCP (Spring Boot default). `max-pool-size = 20`, `min-idle = 5`. Monitor via Actuator. |

---

## 12.5 Git Best Practices

### Git Flow

```
main (production)
  ├── develop (integration branch)
  │   ├── feature/BOS-123-customer-crud
  │   ├── feature/BOS-456-invoice-pdf
  │   └── feature/BOS-789-gst-calculation
  │
  ├── release/1.0.0
  │   └── (bug fixes during release stabilization)
  │
  └── hotfix/BOS-999-payment-bug
      └── (merge to main AND develop)
```

### Branch Naming

```
feature/BOS-{ticket}-{short-description}
bugfix/BOS-{ticket}-{short-description}
hotfix/BOS-{ticket}-{short-description}
release/{semver}
chore/{description}
docs/{description}
```

### Conventional Commits

```
feat(invoices): add GST e-invoice IRP integration
fix(payments): correct partial payment calculation rounding
refactor(customers): extract ledger calculation to service
docs(api): add invoice endpoint documentation
test(gst): add IGST calculation edge case tests
chore(deps): bump Spring Boot to 3.3.2
perf(dashboard): add Redis caching for aggregate queries
style(ui): align invoice form fields consistently
ci(deploy): add staging deployment workflow
```

### Pull Request Rules

| Rule | Detail |
|------|--------|
| **Title** | Conventional commit format |
| **Description** | What changed, why, how to test |
| **Size** | Max 400 lines changed (split larger PRs) |
| **Review** | At least 1 approval required |
| **CI** | All checks must pass (build, test, lint) |
| **Squash merge** | Squash on merge to keep history clean |
| **Delete branch** | Auto-delete feature branch after merge |

---

## 12.6 API Best Practices

| Practice | Rule |
|----------|------|
| **REST Standards** | Use proper HTTP verbs, status codes, and resource naming (see Chapter 6 §6.5) |
| **Versioning** | URL-based (`/api/v1/`). Bump major only for breaking changes. |
| **Consistent Response** | Every response wrapped in `ApiResponse` / `PagedResponse` |
| **Idempotency** | POST requests accept optional `Idempotency-Key` header. Return same response on duplicate. |
| **OpenAPI** | Auto-generated via Springdoc. Available at `/api/v1/docs`. |
| **Pagination** | Page-based (not cursor). `page`, `size`, `sort` params. Max `size=100`. |
| **Filtering** | Query params for common filters. Complex filters via request body POST (future). |
| **Sorting** | `sort=field,direction`. Multiple sort fields supported. |
| **Search** | `search` param for full-text search across relevant fields. |
| **HATEOAS** | Not used in MVP (adds complexity). Evaluate for v2. |
| **Rate Limit Headers** | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **Request ID** | `X-Request-ID` header on every response (for debugging / support). |
| **Compression** | `gzip` response compression for payloads > 1KB. |

---

## 12.7 Docker Best Practices

| Practice | Rule |
|----------|------|
| **One Dockerfile per service** | `/docker/backend/Dockerfile`, `/docker/ai-service/Dockerfile` |
| **Multi-stage builds** | Build stage → Runtime stage (smaller images) |
| **Non-root user** | `USER 1001:1001` in Dockerfile |
| **Health checks** | `HEALTHCHECK CMD curl -f http://localhost:8080/actuator/health` |
| **.dockerignore** | Exclude `.git`, `node_modules`, `target/`, `__pycache__/` |
| **Pin versions** | `FROM eclipse-temurin:21-jre-jammy` (not `latest`) |
| **Layer caching** | Copy dependency files first, then source code |
| **Read-only filesystem** | `--read-only` flag + `tmpfs` for temp dirs |
| **Resource limits** | `deploy.resources.limits: memory: 512M` in Compose |
| **Docker Compose** | For local dev only. One command: `docker compose up` |

### Example Backend Dockerfile

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
RUN groupadd -r billos && useradd -r -g billos billos
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER billos:billos
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 12.8 Logging Best Practices

| Practice | Rule |
|----------|------|
| **Structured JSON** | All production logs in JSON format (Logback + JSON encoder) |
| **Correlation IDs** | Every request assigned a `traceId` (UUID), propagated through all layers |
| **Request tracing** | Log: method, path, status, duration, userId, orgId, traceId |
| **Audit logging** | Business events logged to `audit_logs` table (not just file logs) |
| **PII masking** | Never log passwords, tokens, bank details. Mask email/phone. |
| **Log levels** | ERROR (alerts), WARN (investigate), INFO (business events), DEBUG (dev only) |
| **No `System.out`** | Always use SLF4J logger. Never `println`. |
| **Log rotation** | Max 100MB per file, 7 days retention, gzip compression |

---

## 12.9 Error Handling Best Practices

| Practice | Rule |
|----------|------|
| **Standard format** | Every error response follows the error format (see Chapter 6 §6.5) |
| **Error codes** | Machine-readable codes: `CUSTOMER_NOT_FOUND`, `CREDIT_LIMIT_EXCEEDED` |
| **Validation errors** | Return all field errors at once (not one at a time) |
| **Business exceptions** | Custom exception classes extending `RuntimeException` |
| **Global handler** | Single `@ControllerAdvice` catches all exceptions |
| **No stack traces** | Never expose stack traces in API responses |
| **Sentry** | 500 errors auto-reported to Sentry with context |
| **Client-side** | TanStack Query `onError` handlers + toast notifications |

---

> **Next:** [Chapter 13 — Testing Strategy](./13-testing-strategy.md)
