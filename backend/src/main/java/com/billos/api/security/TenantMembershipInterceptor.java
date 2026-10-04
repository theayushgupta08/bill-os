package com.billos.api.security;

import com.billos.api.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Enforces that the caller actually belongs to the organization named in {@code X-Organization-Id}.
 *
 * <p>{@link com.billos.api.tenant.TenantFilter} trusts the header blindly, and Hibernate's {@code @TenantId}
 * only scopes queries to whatever tenant is set — so without this check any authenticated user could read or
 * write another organization's data by changing the header. Runs after Spring Security, so the principal is
 * available.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantMembershipInterceptor implements HandlerInterceptor {

    /**
     * Endpoints that are not scoped to the active tenant. {@code /organizations/**} and {@code /users/**}
     * address organizations/users by path or by the principal and enforce access in their services.
     */
    private static final List<String> TENANT_AGNOSTIC_PREFIXES =
            List.of("/api/v1/public", "/api/v1/health", "/api/v1/users", "/api/v1/organizations");

    private final TenantSecurity tenantSecurity;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler)
            throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (isTenantAgnostic(path)) {
            // These routes don't need a tenant, but a header still scopes Hibernate (and auditing) if it is set.
            // Keep it only when the caller really belongs to that organization, so that a forged header can never
            // point one of these endpoints at another tenant's data.
            String tenant = TenantContext.getCurrentTenant();
            if (tenant != null && !isMemberOfOrg(tenant)) {
                TenantContext.clear();
            }
            return true;
        }

        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            return reject(response, HttpStatus.BAD_REQUEST, "X-Organization-Id header is required");
        }

        UUID orgId;
        try {
            orgId = UUID.fromString(tenant);
        } catch (IllegalArgumentException e) {
            return reject(response, HttpStatus.BAD_REQUEST, "X-Organization-Id must be a valid UUID");
        }

        if (!tenantSecurity.isMemberOf(orgId)) {
            log.warn("Rejected request to {} for organization {}: caller is not a member", path, orgId);
            return reject(response, HttpStatus.FORBIDDEN, "You do not have access to this organization");
        }

        return true;
    }

    private boolean isMemberOfOrg(String tenant) {
        try {
            return tenantSecurity.isMemberOf(UUID.fromString(tenant));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isTenantAgnostic(String path) {
        return TENANT_AGNOSTIC_PREFIXES.stream()
                .anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }

    private boolean reject(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("message", message));
        return false;
    }
}
