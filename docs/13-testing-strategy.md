# Chapter 13 — Testing Strategy

> Back to [Index](./README.md) | Prev ← [Best Practices](./12-best-practices.md) | Next → [CI/CD](./14-ci-cd.md)

---

## 13.1 Testing Pyramid

```
          ╱ ╲
         ╱   ╲          E2E / UI Tests (few, slow, high confidence)
        ╱  E2E ╲         - Playwright: critical user journeys
       ╱───────╲         - Invoice creation flow, login flow
      ╱         ╲
     ╱ API Tests ╲       API / Integration Tests (moderate count)
    ╱─────────────╲      - TestContainers + real DB
   ╱               ╲     - Full request → response validation
  ╱   Unit Tests    ╲    Unit Tests (many, fast, isolated)
 ╱───────────────────╲   - Service logic, validators, mappers
╱                     ╲  - Mocked dependencies
```

---

## 13.2 Coverage Targets

| Layer | Target | Tool |
|-------|--------|------|
| Backend Unit Tests | ≥ 80% line coverage | JaCoCo |
| Backend Integration Tests | ≥ 60% (critical paths) | TestContainers |
| Frontend Unit Tests | ≥ 70% | Vitest |
| Frontend Component Tests | ≥ 60% | Vitest + Testing Library |
| API Tests | 100% of endpoints | Spring MockMvc / REST Assured |
| E2E Tests | Critical user journeys (top 10) | Playwright |
| AI Tests | Prompt regression suite | Custom evaluation harness |

---

## 13.3 Backend Unit Tests

**Framework:** JUnit 5 + Mockito + AssertJ

### What to Unit Test

| Component | Test Focus |
|-----------|-----------|
| **Services** | Business logic, validation rules, calculations |
| **GstCalculationService** | Tax computation for all GST scenarios (intra/inter/exempt/nil/composition) |
| **InvoiceNumberService** | Sequential numbering, FY reset, branch codes |
| **AmountToWords** | Indian number system conversion (edge cases: 0, max, decimals) |
| **IndianNumberFormat** | ₹12,34,567.89 formatting |
| **GstinValidator** | GSTIN format + checksum validation |
| **Mappers** | DTO ↔ Entity mapping correctness |

### Example

```java
@ExtendWith(MockitoExtension.class)
class GstCalculationServiceTest {

    @InjectMocks
    private GstCalculationService gstService;

    @Test
    void shouldCalculateCgstSgstForIntraState() {
        var result = gstService.calculate(
            new BigDecimal("10000"),   // taxable amount
            new BigDecimal("18"),      // GST rate
            SupplyType.INTRA_STATE
        );

        assertThat(result.getCgst()).isEqualByComparingTo("900.00");
        assertThat(result.getSgst()).isEqualByComparingTo("900.00");
        assertThat(result.getIgst()).isEqualByComparingTo("0.00");
        assertThat(result.getTotalTax()).isEqualByComparingTo("1800.00");
    }

    @Test
    void shouldCalculateIgstForInterState() {
        var result = gstService.calculate(
            new BigDecimal("10000"),
            new BigDecimal("18"),
            SupplyType.INTER_STATE
        );

        assertThat(result.getCgst()).isEqualByComparingTo("0.00");
        assertThat(result.getSgst()).isEqualByComparingTo("0.00");
        assertThat(result.getIgst()).isEqualByComparingTo("1800.00");
    }
}
```

---

## 13.4 Backend Integration Tests

**Framework:** JUnit 5 + TestContainers + Spring Boot Test

### Setup

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
class InvoiceControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("billos_test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7")
        .withExposedPorts(6379);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateInvoiceAndUpdateStock() throws Exception {
        // Arrange: create org, customer, product, warehouse with stock

        // Act: create invoice
        mockMvc.perform(post("/api/v1/invoices")
            .header("Authorization", "Bearer " + jwtToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(invoiceRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.invoiceNumber").exists())
            .andExpect(jsonPath("$.data.totalAmount").value(65760.00));

        // Assert: stock decreased
        var stock = inventoryRepository.findByProductId(productId);
        assertThat(stock.getQuantity()).isEqualTo(initialStock - 10);

        // Assert: customer outstanding increased
        var customer = customerRepository.findById(customerId);
        assertThat(customer.getOutstanding()).isEqualByComparingTo("65760.00");

        // Assert: audit log created
        var auditLogs = auditLogRepository.findByEntityId(invoiceId);
        assertThat(auditLogs).hasSize(1);
        assertThat(auditLogs.get(0).getAction()).isEqualTo("CREATE");
    }
}
```

### Tenant Isolation Tests

```java
@Test
void shouldNotAccessCrossOrganizationData() throws Exception {
    // Arrange: create customer in Org A
    UUID orgACustomerId = createCustomer(orgAToken, "Customer A");

    // Act: try to access from Org B
    mockMvc.perform(get("/api/v1/customers/" + orgACustomerId)
        .header("Authorization", "Bearer " + orgBToken))
        .andExpect(status().isNotFound());  // Must not leak data
}
```

---

## 13.5 Frontend Unit Tests

**Framework:** Vitest + React Testing Library

### What to Test

| Component | Test Focus |
|-----------|-----------|
| **Utility functions** | `formatCurrency`, `formatDate`, `validateGstin`, `amountToWords` |
| **Zustand stores** | State transitions, actions, selectors |
| **Custom hooks** | `useDebounce`, `usePagination` behavior |
| **Form schemas** | Zod validation (valid/invalid inputs) |
| **Component rendering** | Key UI components render correctly with various props |

### Example

```typescript
import { describe, it, expect } from 'vitest';
import { formatIndianCurrency, validateGstin } from '@/lib/utils';

describe('formatIndianCurrency', () => {
  it('formats large amounts in Indian numbering system', () => {
    expect(formatIndianCurrency(1234567.89)).toBe('₹12,34,567.89');
  });

  it('handles zero', () => {
    expect(formatIndianCurrency(0)).toBe('₹0.00');
  });

  it('handles negative amounts', () => {
    expect(formatIndianCurrency(-5000)).toBe('-₹5,000.00');
  });
});

describe('validateGstin', () => {
  it('accepts valid GSTIN', () => {
    expect(validateGstin('27AABCU9603R1ZM')).toBe(true);
  });

  it('rejects invalid GSTIN', () => {
    expect(validateGstin('INVALID')).toBe(false);
  });
});
```

---

## 13.6 API Tests

**Coverage:** 100% of endpoints tested for:
- ✅ Happy path (valid request → correct response)
- ✅ Validation errors (invalid input → 400)
- ✅ Authorization (wrong role → 403)
- ✅ Not found (missing resource → 404)
- ✅ Conflict (duplicate → 409)
- ✅ Tenant isolation (cross-org → 404)

---

## 13.7 E2E Tests

**Framework:** Playwright

### Critical User Journeys

| # | Journey | Steps |
|---|---------|-------|
| 1 | **Registration + Onboarding** | Register → verify email → create org → setup GST → land on dashboard |
| 2 | **Create Invoice** | Navigate → select customer → add products → calculate tax → save → verify PDF |
| 3 | **Record Payment** | Open invoice → record payment → verify status change → verify customer outstanding |
| 4 | **Create Purchase** | Navigate → select supplier → add items → save → verify stock increase |
| 5 | **View Dashboard** | Login → verify all dashboard cards load with data |
| 6 | **Generate Report** | Navigate to reports → select sales register → filter by date → export to Excel |
| 7 | **Manage Settings** | Navigate → update org details → save → verify changes persisted |
| 8 | **User Invitation** | Admin invites user → verify email sent → new user accepts → verify access |
| 9 | **Search & Filter** | Search customers → filter by outstanding → sort by name → verify results |
| 10 | **Mobile Responsive** | Repeat journeys 2, 3, 5 at 375px viewport |

---

## 13.8 Load Testing

**Tool:** k6 (Grafana)

### Scenarios

| Scenario | Virtual Users | Duration | Target |
|----------|--------------|----------|--------|
| **Smoke Test** | 5 | 1 min | Verify system works under minimal load |
| **Average Load** | 50 | 10 min | Simulate typical usage (API p95 < 300ms) |
| **Peak Load** | 200 | 5 min | Simulate peak hours (no errors, p99 < 1s) |
| **Stress Test** | 500 | 5 min | Find breaking point |
| **Soak Test** | 50 | 2 hours | Detect memory leaks, connection pool exhaustion |

### Key Endpoints to Load Test

- `GET /api/v1/dashboard/summary` — Most frequently accessed
- `POST /api/v1/invoices` — Write-heavy, involves stock update
- `GET /api/v1/invoices?page=0&size=20` — Common list query
- `GET /api/v1/reports/sales-register` — Heavy aggregation query
- `POST /api/v1/auth/login` — Auth under load

---

## 13.9 Security Testing

| Test Type | Tool | Frequency |
|----------|------|-----------|
| **Dependency Scanning** | Dependabot / Snyk | Every PR |
| **SAST (Static Analysis)** | SonarQube / Semgrep | Every PR |
| **DAST (Dynamic Analysis)** | OWASP ZAP | Monthly |
| **Penetration Testing** | Manual / third-party | Quarterly |
| **Secret Scanning** | GitHub Secret Scanning | Continuous |
| **Container Scanning** | Trivy | Every build |

### Security Test Checklist

- [ ] JWT token cannot be forged
- [ ] Expired JWT is rejected
- [ ] Refresh token rotation works correctly
- [ ] Revoked refresh token is rejected
- [ ] Account lockout triggers after 5 failed logins
- [ ] Cross-tenant data access is impossible
- [ ] SQL injection attempts are blocked
- [ ] XSS payloads are sanitized
- [ ] Rate limiting triggers correctly
- [ ] CORS blocks unauthorized origins
- [ ] File uploads reject dangerous file types
- [ ] Admin endpoints reject non-admin users
- [ ] Deleted resources return 404 (not data)

---

## 13.10 AI Evaluation Tests

### Prompt Regression Testing

Maintain a test suite of 50+ prompt/expected-output pairs:

```python
# tests/test_prompts.py
@pytest.mark.parametrize("prompt,expected_intent", [
    ("What were my total sales in June?", "DATA_QUERY"),
    ("Create an invoice for Priya Electronics", "ACTION_CREATE"),
    ("Explain my GST liability", "EXPLANATION"),
    ("Show me Rajesh's outstanding", "ENTITY_LOOKUP"),
])
def test_intent_classification(prompt, expected_intent):
    result = classify_intent(prompt)
    assert result == expected_intent
```

### OCR Accuracy Testing

- Maintain 20+ sample invoice images with ground truth
- Measure field-level accuracy (target: ≥ 95%)
- Measure end-to-end accuracy (target: ≥ 85%)
- Run on every prompt template or preprocessing change

---

> **Next:** [Chapter 14 — CI/CD](./14-ci-cd.md)
