package com.billos.api.security;

import com.billos.api.entity.UserOrgRole;
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

    private static final List<String> ROLE_HIERARCHY = List.of("OWNER", "ADMIN", "MANAGER", "USER", "VIEWER");

    public boolean hasRole(String requiredRole) {
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            return false;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            return false;
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        UUID userId = principal.getId();
        UUID orgId = UUID.fromString(currentTenant);

        Optional<UserOrgRole> userOrgRoleOpt = userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId);
        if (userOrgRoleOpt.isEmpty()) {
            return false;
        }

        String userRole = userOrgRoleOpt.get().getRole();

        // Check hierarchy (lower index means higher privilege)
        int requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
        int userLevel = ROLE_HIERARCHY.indexOf(userRole);

        if (requiredLevel == -1 || userLevel == -1) {
            return false;
        }

        return userLevel <= requiredLevel;
    }

    public boolean isMember() {
        return hasRole("VIEWER"); // Lowest role implies membership
    }
}
