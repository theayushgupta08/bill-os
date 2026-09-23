package com.billos.api.security;

import com.billos.api.tenant.TenantContext;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;

    // Rate Limit Definitions.
    // Note: login/register/password-reset throttling now lives in Supabase Auth, which serves those
    // endpoints directly — the browser never routes them through this API.
    private static final Bandwidth LIMIT_DASHBOARD = Bandwidth.builder()
            .capacity(60)
            .refillIntervally(60, Duration.ofMinutes(1))
            .build();
    private static final Bandwidth LIMIT_REPORTS = Bandwidth.builder()
            .capacity(20)
            .refillIntervally(20, Duration.ofMinutes(1))
            .build();
    private static final Bandwidth LIMIT_SEARCH = Bandwidth.builder()
            .capacity(300)
            .refillIntervally(300, Duration.ofMinutes(1))
            .build();
    private static final Bandwidth LIMIT_AI_FORECAST = Bandwidth.builder()
            .capacity(5)
            .refillIntervally(5, Duration.ofHours(1))
            .build();
    private static final Bandwidth LIMIT_FILES = Bandwidth.builder()
            .capacity(30)
            .refillIntervally(30, Duration.ofHours(1))
            .build();
    private static final Bandwidth LIMIT_CRUD = Bandwidth.builder()
            .capacity(120)
            .refillIntervally(120, Duration.ofMinutes(1))
            .build();

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler)
            throws Exception {
        String path = request.getRequestURI();

        // Exclude Swagger, Actuator, and Health Check from Rate Limiting
        if (path.startsWith("/api/v1/health")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/actuator")) {
            return true;
        }

        // Determine Category and Key
        RateLimitConfig config = determineLimit(request, path);

        // If config is null, bypass rate limiting (e.g. AI Chat per user request)
        if (config == null) {
            return true;
        }

        Bucket bucket = rateLimitingService.resolveBucket(config.cacheKey(), config.bandwidth());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        } else {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.getWriter().write("Too many requests. Please try again in " + waitForRefill + " seconds.");
            log.warn("Rate limit exceeded for key: {}", config.cacheKey());
            return false;
        }
    }

    private RateLimitConfig determineLimit(HttpServletRequest request, String path) {
        // Fall back to the caller's IP rather than a shared "anonymous" key, so one unauthenticated
        // caller cannot drain the bucket for every other unauthenticated caller.
        String userKey = getAuthenticatedUserKey().orElseGet(() -> "ip:" + getClientIp(request));
        String tenantKey = TenantContext.getCurrentTenant() != null ? TenantContext.getCurrentTenant() : "no-tenant";

        if (path.startsWith("/api/v1/dashboard")) {
            return new RateLimitConfig("rl:dashboard:" + userKey, LIMIT_DASHBOARD);
        } else if (path.startsWith("/api/v1/reports")) {
            return new RateLimitConfig("rl:reports:" + userKey, LIMIT_REPORTS);
        } else if (path.startsWith("/api/v1/ai/chat")) {
            // MVP: Bypass AI Chat entirely until Subscription limits are mapped.
            return null;
        } else if (path.startsWith("/api/v1/ai/forecast")) {
            return new RateLimitConfig("rl:ai-forecast:" + tenantKey, LIMIT_AI_FORECAST);
        } else if (path.startsWith("/api/v1/files")) {
            return new RateLimitConfig("rl:files:" + tenantKey, LIMIT_FILES);
        } else if (path.contains("/search") || request.getParameter("query") != null) {
            // getRequestURI() never includes the query string, so check the parameter itself
            return new RateLimitConfig("rl:search:" + userKey, LIMIT_SEARCH);
        }

        // Default CRUD APIs
        return new RateLimitConfig("rl:crud:" + userKey, LIMIT_CRUD);
    }

    /**
     * The real client address. Never read X-Forwarded-For here: its left-most entry is whatever the client sent,
     * so trusting it lets anyone pick a fresh rate-limit bucket per request. Tomcat's RemoteIpValve
     * ({@code server.forward-headers-strategy: native}) already resolves the client by walking the header from the
     * right and only trusting hops from configured proxies, and exposes the result as the remote address.
     */
    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    private Optional<String> getAuthenticatedUserKey() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal principal) {
            return Optional.of(principal.getId().toString());
        }
        return Optional.empty();
    }

    private record RateLimitConfig(String cacheKey, Bandwidth bandwidth) {}
}
