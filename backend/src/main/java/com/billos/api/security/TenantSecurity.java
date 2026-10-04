package com.billos.api.security;

import com.billos.api.entity.Organization;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.tenant.TenantContext;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

@Service("tenantSecurity")
@RequiredArgsConstructor
public class TenantSecurity {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final OrganizationRepository organizationRepository;

    private static final String ROLE_CACHE_ATTRIBUTE = TenantSecurity.class.getName() + ".role:";
    private static final String NO_ROLE = "";

    /** True when the current user holds at least {@code requiredRole} in the org named by X-Organization-Id. */
    public boolean hasRole(String requiredRole) {
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            return false;
        }

        UUID orgId;
        try {
            orgId = UUID.fromString(currentTenant);
        } catch (IllegalArgumentException e) {
            return false;
        }
        return hasRoleIn(orgId, requiredRole);
    }

    public boolean isMember() {
        return hasRole("VIEWER"); // Lowest role implies membership
    }

    /** True when the current user holds at least {@code requiredRole} in {@code orgId}. */
    public boolean hasRoleIn(UUID orgId, String requiredRole) {
        if (orgId == null) {
            return false;
        }

        Optional<UUID> userId = currentUserId();
        if (userId.isEmpty()) {
            return false;
        }

        return Roles.satisfies(effectiveRoleForRequest(userId.get(), orgId), requiredRole);
    }

    /**
     * The current user's effective role in {@code orgId} (direct, or inherited from the parent organization), or
     * empty when they have none. It's the role {@code @PreAuthorize} sees, so services comparing the caller with
     * another member should use this rather than re-reading memberships.
     */
    public Optional<String> currentRoleIn(UUID orgId) {
        if (orgId == null) {
            return Optional.empty();
        }
        return currentUserId().map(userId -> effectiveRoleForRequest(userId, orgId));
    }

    public boolean isMemberOf(UUID orgId) {
        return hasRoleIn(orgId, "VIEWER");
    }

    private Optional<UUID> currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return Optional.empty();
        }
        return Optional.of(principal.getId());
    }

    /**
     * The membership interceptor and each {@code @PreAuthorize} ask for the same role within one request;
     * memoize it in request scope so that costs one lookup instead of several.
     */
    private String effectiveRoleForRequest(UUID userId, UUID orgId) {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        String key = ROLE_CACHE_ATTRIBUTE + userId + ":" + orgId;
        if (attributes != null) {
            Object cached = attributes.getAttribute(key, RequestAttributes.SCOPE_REQUEST);
            if (cached != null) {
                return NO_ROLE.equals(cached) ? null : (String) cached;
            }
        }
        String role = resolveEffectiveRole(userId, orgId);
        if (attributes != null) {
            attributes.setAttribute(key, role != null ? role : NO_ROLE, RequestAttributes.SCOPE_REQUEST);
        }
        return role;
    }

    private String resolveEffectiveRole(UUID userId, UUID orgId) {
        Optional<UserOrgRole> direct = userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId);
        // Someone deactivated in this organization has no access to it, whatever the parent would grant
        if (direct.isPresent() && !direct.get().isActiveMembership()) {
            return null;
        }
        String userRole = direct.map(UserOrgRole::getRole).orElse(null);
        if (Roles.OWNER.equals(userRole)) {
            return userRole;
        }

        // Unified team & permissions: a branch inherits roles from its parent organization; the higher one applies
        String parentRole = organizationRepository
                .findById(orgId)
                .map(Organization::getParentOrganizationId)
                .flatMap(parentId -> userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentId))
                .filter(UserOrgRole::isActiveMembership)
                .map(UserOrgRole::getRole)
                .orElse(null);
        return Roles.higherOf(userRole, parentRole);
    }
}
