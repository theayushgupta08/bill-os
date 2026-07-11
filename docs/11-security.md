# Chapter 11 — Security

> Back to [Index](./README.md) | Prev ← [UI/UX Design System](./10-ui-ux-design-system.md) | Next → [Best Practices](./12-best-practices.md)

---

## 11.1 Security Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: EDGE (Cloudflare)                                     │
│  ├── DDoS Protection (L3/L4/L7)                                │
│  ├── Web Application Firewall (WAF)                             │
│  ├── Bot Management                                             │
│  ├── SSL/TLS Termination (TLS 1.3)                             │
│  └── Rate Limiting (global)                                     │
│                                                                 │
│  Layer 2: TRANSPORT                                              │
│  ├── HTTPS everywhere (HSTS headers)                            │
│  ├── Certificate pinning (mobile, future)                       │
│  └── Secure headers (CSP, X-Frame-Options, etc.)               │
│                                                                 │
│  Layer 3: APPLICATION (Spring Security)                         │
│  ├── JWT Validation (RS256)                                     │
│  ├── RBAC Permission Checks                                    │
│  ├── Tenant Isolation (organization_id)                        │
│  ├── Input Validation (Bean Validation + Zod)                  │
│  ├── CORS Policy                                                │
│  ├── CSRF Protection                                            │
│  ├── Rate Limiting (per user/org, Redis-backed)                │
│  └── Audit Logging                                              │
│                                                                 │
│  Layer 4: DATA                                                  │
│  ├── Encryption at Rest (AES-256, Supabase managed)            │
│  ├── Password Hashing (BCrypt, cost 12)                        │
│  ├── PII Masking in Logs                                        │
│  ├── Parameterized Queries (JPA — no SQL injection)            │
│  └── Row-Level Security (Supabase RLS)                         │
│                                                                 │
│  Layer 5: OPERATIONAL                                            │
│  ├── Secrets Management (env vars, never in code)              │
│  ├── Dependency Scanning (Dependabot / Snyk)                   │
│  ├── Container Security (non-root, read-only FS)               │
│  └── Penetration Testing (quarterly)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11.2 JWT Security

| Aspect | Configuration |
|--------|-------------|
| Algorithm | RS256 (asymmetric — private key signs, public key verifies) |
| Access Token Expiry | 15 minutes |
| Refresh Token Expiry | 7 days |
| Key Rotation | Quarterly key rotation with grace period |
| Token Storage (client) | Access token: in-memory variable. Refresh token: `httpOnly`, `Secure`, `SameSite=Strict` cookie |
| Token Revocation | Refresh tokens stored in DB; can be revoked individually or by family |
| Reuse Detection | Token family tracking — reuse of old refresh token revokes entire family |
| Claims | `sub`, `email`, `org_id`, `role`, `permissions`, `iat`, `exp`, `iss` |

### Why RS256 (not HS256)?

- Private key only on the backend server (signs tokens)
- Public key can be distributed to any service that needs to verify (AI service, future microservices)
- Key compromise is isolated — rotate the private key, all services use new public key

---

## 11.3 HTTPS / TLS

| Configuration | Value |
|--------------|-------|
| Minimum TLS Version | 1.2 (1.3 preferred) |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| Certificate | Cloudflare Universal SSL (auto-renewed) |
| Origin Server | Full (strict) SSL between Cloudflare and origin |

---

## 11.4 CORS Policy

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(
                "https://billos.app",
                "https://staging.billos.app",
                "http://localhost:3000"  // Dev only
            )
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Request-ID")
            .allowCredentials(true)  // Required for httpOnly cookies
            .maxAge(3600);
    }
}
```

---

## 11.5 CSRF Protection

| Strategy | Detail |
|----------|--------|
| API Endpoints | CSRF disabled for stateless JWT API (`/api/**`) |
| Cookie-based refresh | Protected by `SameSite=Strict` attribute |
| Form submissions | N/A (SPA — all requests via API client with JWT) |

---

## 11.6 XSS Prevention

| Layer | Protection |
|-------|-----------|
| **React** | JSX auto-escapes rendered content |
| **Content-Security-Policy** | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://api.billos.app` |
| **X-Content-Type-Options** | `nosniff` |
| **Input Sanitization** | HTML strip on all text inputs (server-side) |
| **Rich Text** | Not used in MVP (prevents stored XSS) |

---

## 11.7 SQL Injection Prevention

| Protection | Method |
|-----------|--------|
| **JPA/Hibernate** | All queries via repository methods or JPQL (parameterized) |
| **No raw SQL** | Zero `@Query` with string concatenation |
| **AI SQL Generation** | Read-only queries, parameterized, allow-listed tables only |
| **Input Validation** | All DTOs validated before reaching service layer |

---

## 11.8 Rate Limiting

| Tier | Limit | Window | Scope |
|------|-------|--------|-------|
| **Anonymous** | 20 requests | per minute | per IP |
| **Authenticated** | 100 requests | per minute | per user |
| **Organization** | 1,000 requests | per minute | per org |
| **Auth endpoints** | 5 requests | per minute | per IP |
| **AI endpoints** | 30 requests | per minute | per user |
| **File upload** | 10 requests | per minute | per user |
| **Report export** | 5 requests | per minute | per user |

**Implementation:** Redis sliding window counter via `RateLimitFilter`.

**Response on limit exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 42 seconds.",
    "retryAfter": 42
  }
}
```
**Header:** `Retry-After: 42`, `X-RateLimit-Limit: 100`, `X-RateLimit-Remaining: 0`

---

## 11.9 Password Security

| Aspect | Configuration |
|--------|-------------|
| **Hashing Algorithm** | BCrypt |
| **Cost Factor** | 12 (≈250ms per hash — resistant to brute force) |
| **Minimum Length** | 8 characters |
| **Complexity** | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| **Common Password Check** | Reject top 10,000 common passwords |
| **Breach Database** | Check against HaveIBeenPwned API (future) |
| **Account Lockout** | 5 failed attempts → 30 min lockout |
| **Password History** | Cannot reuse last 5 passwords (future) |

---

## 11.10 Secrets Management

| Secret | Storage | Access |
|--------|---------|--------|
| Database URL | Environment variable | Runtime only |
| JWT Private Key | Environment variable (PEM) | Backend only |
| Redis URL | Environment variable | Backend only |
| Supabase Service Key | Environment variable | Backend only |
| Resend API Key | Environment variable | Backend only |
| Claude API Key | Environment variable | AI service only |
| OpenAI API Key | Environment variable | AI service only |
| Gemini API Key | Environment variable | AI service only |
| Sentry DSN | Environment variable | Frontend + Backend |

**Rules:**
- ❌ Never commit secrets to Git
- ❌ Never log secrets (even partially)
- ❌ Never include in API responses
- ✅ `.env.example` with placeholder values only
- ✅ `.gitignore` includes `.env*` (except `.env.example`)
- ✅ Production secrets via hosting provider's secret management (Railway/Render secrets, Vercel env vars)

---

## 11.11 Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (CSP is the modern replacement)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [see §11.6]
```

---

## 11.12 Audit Logging

All security-relevant events are logged immutably:

| Event | Data Captured |
|-------|--------------|
| Login success | User, IP, User-Agent, timestamp |
| Login failure | Email attempted, IP, User-Agent, reason |
| Password change | User, IP, timestamp |
| Permission change | User, old role, new role, changed by |
| Data export | User, report type, date range, format |
| Invoice void | User, invoice ID, reason |
| User invited/removed | Actor, target user, role |
| Organization settings change | Actor, setting key, old/new value |
| API key created/revoked | Actor, key ID, permissions |

---

## 11.13 Data Encryption

| Data State | Method |
|-----------|--------|
| **At Rest** | AES-256 (Supabase managed, transparent) |
| **In Transit** | TLS 1.3 (all connections) |
| **Backups** | Encrypted (Supabase managed) |
| **PII in Logs** | Masked (email → r***@e***.com, phone → 9***43210) |
| **Bank Details** | Encrypted column (application-level, AES-256-GCM) |
| **JWT Tokens** | RS256 signed (tamper-proof) |

---

## 11.14 OWASP Top 10 Checklist

| # | Vulnerability | Mitigation |
|---|--------------|-----------|
| A01 | Broken Access Control | RBAC, tenant isolation, @PreAuthorize |
| A02 | Cryptographic Failures | BCrypt, TLS 1.3, AES-256, RS256 JWT |
| A03 | Injection | JPA parameterized queries, input validation |
| A04 | Insecure Design | Threat modeling, security reviews |
| A05 | Security Misconfiguration | Security headers, minimal attack surface |
| A06 | Vulnerable Components | Dependabot, Snyk scanning |
| A07 | Auth Failures | Account lockout, MFA (P2), session management |
| A08 | Software/Data Integrity | Signed JWTs, CI/CD pipeline integrity |
| A09 | Logging/Monitoring Failures | Structured logging, audit trail, Sentry |
| A10 | SSRF | No user-controlled URLs in server-side requests |

---

> **Next:** [Chapter 12 — Best Practices](./12-best-practices.md)
