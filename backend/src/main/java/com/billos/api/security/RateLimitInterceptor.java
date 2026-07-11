package com.billos.api.security;

import com.billos.api.tenant.TenantContext;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;

    // Rate Limit Definitions
    private static final Bandwidth LIMIT_LOGIN = Bandwidth.builder().capacity(5).refillIntervally(5, Duration.ofMinutes(1)).build();
    private static final Bandwidth LIMIT_REGISTER = Bandwidth.builder().capacity(3).refillIntervally(3, Duration.ofHours(1)).build();
    private static final Bandwidth LIMIT_REFRESH = Bandwidth.builder().capacity(20).refillIntervally(20, Duration.ofMinutes(1)).build();
    private static final Bandwidth LIMIT_DASHBOARD = Bandwidth.builder().capacity(60).refillIntervally(60, Duration.ofMinutes(1)).build();
    private static final Bandwidth LIMIT_REPORTS = Bandwidth.builder().capacity(20).refillIntervally(20, Duration.ofMinutes(1)).build();
    private static final Bandwidth LIMIT_SEARCH = Bandwidth.builder().capacity(300).refillIntervally(300, Duration.ofMinutes(1)).build();
    private static final Bandwidth LIMIT_AI_FORECAST = Bandwidth.builder().capacity(5).refillIntervally(5, Duration.ofHours(1)).build();
    private static final Bandwidth LIMIT_FILES = Bandwidth.builder().capacity(30).refillIntervally(30, Duration.ofHours(1)).build();
    private static final Bandwidth LIMIT_CRUD = Bandwidth.builder().capacity(120).refillIntervally(120, Duration.ofMinutes(1)).build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        
        // Exclude Swagger and Actuator from Rate Limiting
        if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui") || path.startsWith("/actuator")) {
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
        String ip = getClientIp(request);
        String userKey = getAuthenticatedUserKey().orElse("anonymous");
        String tenantKey = TenantContext.getCurrentTenant() != null ? TenantContext.getCurrentTenant() : "no-tenant";

        if (path.equals("/api/v1/auth/login")) {
            return new RateLimitConfig("rl:login:" + ip, LIMIT_LOGIN);
        } else if (path.equals("/api/v1/auth/register")) {
            return new RateLimitConfig("rl:register:" + ip, LIMIT_REGISTER);
        } else if (path.startsWith("/api/v1/auth/forgot-password")) {
            return new RateLimitConfig("rl:forgot-password:" + ip, LIMIT_REGISTER); // Uses same limit Bandwidth as register
        } else if (path.startsWith("/api/v1/auth/refresh")) {
            return new RateLimitConfig("rl:refresh:" + userKey, LIMIT_REFRESH);
        } else if (path.startsWith("/api/v1/dashboard")) {
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
        } else if (path.contains("/search") || path.contains("?query=")) {
            return new RateLimitConfig("rl:search:" + userKey, LIMIT_SEARCH);
        }

        // Default CRUD APIs
        return new RateLimitConfig("rl:crud:" + userKey, LIMIT_CRUD);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
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
