package com.billos.api.security;

import com.billos.api.entity.Organization;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.tenant.TenantContext;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("tenantSecurity")
@RequiredArgsConstructor
public class TenantSecurity {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final OrganizationRepository organizationRepository;

    private static final List<String> ROLE_HIERARCHY = List.of("OWNER", "ADMIN", "MANAGER", "USER", "VIEWER");

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

        String userRole = resolveEffectiveRole(userId.get(), orgId);
        if (userRole == null) {
            return false;
        }

        // Check hierarchy (lower index means higher privilege)
        int requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
        int userLevel = ROLE_HIERARCHY.indexOf(userRole);

        if (requiredLevel == -1 || userLevel == -1) {
            return false;
        }

        return userLevel <= requiredLevel;
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

    private String resolveEffectiveRole(UUID userId, UUID orgId) {
        String userRole = userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .map(UserOrgRole::getRole)
                .orElse(null);

        // Unified team & permissions: inherit role from parent organization if current org is a branch
        if (userRole == null || !"OWNER".equalsIgnoreCase(userRole)) {
            Optional<Organization> orgOpt = organizationRepository.findById(orgId);
            if (orgOpt.isPresent() && orgOpt.get().getParentOrganizationId() != null) {
                Optional<UserOrgRole> parentRoleOpt = userOrgRoleRepository.findByUserIdAndOrganizationId(
                        userId, orgOpt.get().getParentOrganizationId());
                if (parentRoleOpt.isPresent()) {
                    String parentRole = parentRoleOpt.get().getRole();
                    if (userRole == null) {
                        userRole = parentRole;
                    } else {
                        int directLevel = ROLE_HIERARCHY.indexOf(userRole);
                        int parentLevel = ROLE_HIERARCHY.indexOf(parentRole);
                        if (parentLevel != -1 && (directLevel == -1 || parentLevel < directLevel)) {
                            userRole = parentRole;
                        }
                    }
                }
            }
        }
        return userRole;
    }
}
