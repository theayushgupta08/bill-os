# Chapter 17 — Coding Standards

> Back to [Index](./README.md) | Prev ← [Roadmap](./16-roadmap.md) | Next → [Performance Targets](./18-performance-targets.md)

---

## 17.1 Java Code Style

### General Rules

| Rule | Standard |
|------|---------|
| **Formatter** | Google Java Style (via `google-java-format` plugin) |
| **Line length** | Max 120 characters |
| **Indentation** | 4 spaces (no tabs) |
| **Imports** | No wildcard imports (`import java.util.*` → `import java.util.List`) |
| **Import order** | `java.` → `javax.` → `org.` → `com.` → `static` (alphabetical within groups) |
| **Final variables** | Prefer `final` for local variables and parameters where possible |
| **Records** | Use Java records for immutable data (DTOs, value objects) |
| **Var** | Acceptable for local variables when type is obvious from right-hand side |
| **Optional** | Use `Optional` for return types that may be absent. Never as method parameter. |
| **Null** | Avoid null — use `Optional`, empty collections, or `@NonNull` annotations |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `InvoiceService`, `CustomerController` |
| Interfaces | PascalCase (no I prefix) | `CustomerRepository`, `PaymentGateway` |
| Methods | camelCase, verb-first | `createInvoice()`, `findByOrganizationId()` |
| Variables | camelCase | `invoiceNumber`, `totalAmount` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Packages | lowercase, dot-separated | `com.billos.api.service` |
| Enums | PascalCase (type), UPPER_SNAKE_CASE (values) | `InvoiceStatus.PARTIALLY_PAID` |
| DTOs | `{Entity}Request`, `{Entity}Response` | `CustomerRequest`, `InvoiceResponse` |
| Mappers | `{Entity}Mapper` | `CustomerMapper` |
| Repositories | `{Entity}Repository` | `CustomerRepository` |
| Services | `{Entity}Service` | `CustomerService` |
| Controllers | `{Entity}Controller` | `CustomerController` |
| Tests | `{Class}Test` | `CustomerServiceTest` |
| Exceptions | `{Description}Exception` | `ResourceNotFoundException` |

### Documentation

```java
/**
 * Calculates GST tax breakdown for a given taxable amount and supply type.
 *
 * @param taxableAmount the pre-tax amount (must be positive)
 * @param gstRate the applicable GST rate (0, 0.25, 3, 5, 12, 18, 28)
 * @param supplyType INTRA_STATE or INTER_STATE
 * @return TaxBreakdown containing CGST, SGST, IGST amounts
 * @throws BusinessRuleException if gstRate is not a valid rate
 */
public TaxBreakdown calculate(BigDecimal taxableAmount, BigDecimal gstRate, SupplyType supplyType) {
    // ...
}
```

- Javadoc on all public methods in service and utility classes
- No Javadoc needed on trivial getters/setters (Lombok handles these)
- Inline comments only for non-obvious business logic

---

## 17.2 TypeScript Style Guide

### General Rules

| Rule | Standard |
|------|---------|
| **Formatter** | Prettier (default config) |
| **Linter** | ESLint with Next.js + TypeScript recommended rules |
| **Strict mode** | `"strict": true` in tsconfig.json |
| **Line length** | Max 100 characters (Prettier default) |
| **Indentation** | 2 spaces |
| **Semicolons** | Required (Prettier default) |
| **Quotes** | Single quotes |
| **Trailing commas** | Always (`"trailingComma": "all"` in Prettier) |
| **No `any`** | Zero tolerance — use `unknown` + type narrowing |
| **No `enum`** | Use `as const` objects or union types |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `InvoiceForm`, `CustomerTable` |
| Component files | kebab-case | `invoice-form.tsx`, `customer-table.tsx` |
| Hooks | camelCase, `use` prefix | `useCustomers`, `useInvoiceForm` |
| Hook files | kebab-case | `use-customers.ts` |
| Types/Interfaces | PascalCase | `Customer`, `InvoiceResponse` |
| Type files | kebab-case | `customer.types.ts` |
| Schemas | camelCase, `Schema` suffix | `customerSchema`, `invoiceFormSchema` |
| Constants | UPPER_SNAKE_CASE or camelCase | `MAX_FILE_SIZE`, `defaultPageSize` |
| Utility functions | camelCase | `formatCurrency`, `validateGstin` |
| Service functions | camelCase, verb-first | `getCustomers`, `createInvoice` |
| Zustand stores | camelCase, `Store` suffix | `authStore`, `uiStore` |
| CSS variables | kebab-case | `--primary`, `--background` |
| Route segments | kebab-case | `purchase-orders`, `credit-notes` |

### Component Structure

```typescript
// 1. Imports (grouped: React → third-party → local)
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { customerSchema, type CustomerFormData } from './schemas';
import { useCreateCustomer } from './hooks';

// 2. Types
interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSuccess: (customerId: string) => void;
}

// 3. Component (named export)
export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  // hooks first
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData,
  });
  const createCustomer = useCreateCustomer();

  // handlers
  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    const result = await createCustomer.mutateAsync(data);
    onSuccess(result.id);
  }, [createCustomer, onSuccess]);

  // render
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* ... */}
    </form>
  );
}
```

---

## 17.3 SQL Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, singular | `customer`, `sales_invoice`, `invoice_item` |
| Columns | snake_case | `display_name`, `total_amount`, `created_at` |
| Primary keys | `id` | `id UUID PRIMARY KEY` |
| Foreign keys | `{referenced_table}_id` | `customer_id`, `organization_id` |
| Indexes | `idx_{table}_{columns}` | `idx_customer_org`, `idx_invoice_date` |
| Unique constraints | `uq_{table}_{columns}` | `uq_customer_code`, `uq_invoice_number` |
| Check constraints | `ck_{table}_{rule}` | `ck_inventory_qty`, `ck_payment_amount` |
| Foreign key constraints | `fk_{table}_{referenced}` | `fk_invoice_customer` |
| Views | `v_{description}` | `v_outstanding_receivables` |
| Functions | `fn_{description}` | `fn_update_timestamp` |
| Triggers | `trg_{table}_{event}` | `trg_customers_updated` |
| Migrations | `V{NNN}__{description}.sql` | `V001__create_users_table.sql` |

### SQL Style

```sql
-- Good: Readable, consistent formatting
SELECT
    si.invoice_number,
    si.invoice_date,
    c.display_name AS customer_name,
    si.total_amount,
    si.due_amount
FROM sales_invoices si
INNER JOIN customers c ON si.customer_id = c.id
WHERE si.organization_id = :orgId
  AND si.status NOT IN ('DRAFT', 'VOID', 'CANCELLED')
  AND si.invoice_date BETWEEN :fromDate AND :toDate
ORDER BY si.invoice_date DESC
LIMIT :pageSize OFFSET :offset;
```

- Keywords in UPPERCASE
- Table aliases are short, meaningful abbreviations
- One clause per line for readability
- Indent conditions under WHERE
- Always qualify column names with table alias in JOINs

---

## 17.4 Folder & File Naming

| Context | Convention | Example |
|---------|-----------|---------|
| React components | kebab-case `.tsx` | `customer-form.tsx` |
| React pages | `page.tsx` (Next.js convention) | `app/(dashboard)/customers/page.tsx` |
| Hooks | `use-*.ts` | `use-customers.ts` |
| Type files | `*.types.ts` | `customer.types.ts` |
| Schema files | `*.schema.ts` | `customer.schema.ts` |
| Service files | `*.service.ts` | `customer.service.ts` |
| Store files | `*.store.ts` | `auth.store.ts` |
| Java classes | PascalCase `.java` | `CustomerService.java` |
| Java packages | lowercase | `com.billos.api.service` |
| Python modules | snake_case `.py` | `invoice_agent.py` |
| SQL migrations | `V{NNN}__{description}.sql` | `V010__create_invoice_tables.sql` |
| Docker files | `Dockerfile` (no extension) | `docker/backend/Dockerfile` |
| Config files | kebab-case | `tailwind.config.ts`, `docker-compose.yml` |
| Environment | `.env.{environment}` | `.env.local`, `.env.example` |
| Documentation | `NN-kebab-case.md` | `01-project-overview.md` |

---

## 17.5 API Naming

| Convention | Example |
|-----------|---------|
| Plural nouns for collections | `/api/v1/customers`, `/api/v1/invoices` |
| Singular for single resource | `/api/v1/customers/{id}` |
| Kebab-case for multi-word | `/api/v1/purchase-orders`, `/api/v1/credit-notes` |
| Nested for relationships | `/api/v1/customers/{id}/invoices` |
| Verbs for actions only | `/api/v1/invoices/{id}/send`, `/api/v1/invoices/{id}/void` |
| No trailing slashes | `/api/v1/customers` (not `/api/v1/customers/`) |
| Query params: camelCase | `?customerId=...&fromDate=...&pageSize=20` |

---

## 17.6 Git Commit Convention

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring (no behavior change) |
| `docs` | Documentation only |
| `test` | Adding/modifying tests |
| `chore` | Maintenance (dependencies, CI, tooling) |
| `perf` | Performance improvement |
| `style` | Code style (formatting, no logic change) |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Reverting a previous commit |

### Scopes

| Scope | Area |
|-------|------|
| `auth` | Authentication & authorization |
| `customers` | Customer module |
| `suppliers` | Supplier module |
| `products` | Product module |
| `inventory` | Inventory module |
| `invoices` | Invoice module |
| `purchases` | Purchase module |
| `payments` | Payment module |
| `reports` | Reporting module |
| `dashboard` | Dashboard module |
| `settings` | Settings module |
| `ai` | AI service |
| `db` | Database migrations |
| `api` | API layer |
| `ui` | Frontend UI |
| `security` | Security changes |
| `deps` | Dependencies |
| `ci` | CI/CD pipeline |
| `docker` | Docker configuration |

### Examples

```
feat(invoices): add GST e-invoice IRP JSON generation
fix(payments): correct rounding in partial payment calculation
refactor(customers): extract ledger calculation to dedicated service
docs(api): document invoice endpoints with request/response examples
test(gst): add IGST calculation tests for inter-state supply
chore(deps): bump Spring Boot to 3.3.2
perf(dashboard): add Redis caching for aggregate dashboard queries
ci(deploy): add production deployment workflow with approval gate
```

---

## 17.7 Documentation Standards

| Document | Location | Convention |
|----------|----------|-----------|
| Architecture decisions | `/docs/` | This handbook (version-controlled) |
| API documentation | Auto-generated | Springdoc OpenAPI at `/api/v1/docs` |
| Code documentation | In-source | Javadoc (Java), JSDoc (TypeScript), docstrings (Python) |
| README files | Root + each service | Setup, run, test instructions |
| Changelog | `CHANGELOG.md` | Auto-generated from conventional commits |
| ADRs (Architecture Decision Records) | `/docs/adr/` | `ADR-001-why-spring-boot.md` format (future) |

### When to Document

- ✅ Public API methods (Javadoc / JSDoc)
- ✅ Complex business logic (inline comments explaining **why**)
- ✅ Non-obvious architectural decisions (ADRs)
- ✅ API endpoints (OpenAPI annotations)
- ❌ Obvious code (`// increment counter` → don't)
- ❌ Generated code (MapStruct implementations, shadcn/ui primitives)

---

> **Next:** [Chapter 18 — Performance Targets](./18-performance-targets.md)
