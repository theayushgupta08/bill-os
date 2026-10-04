package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.billos.api.entity.Organization;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.tenant.TenantContext;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TenantSecurityTest {

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private TenantSecurity tenantSecurity;

    private final UUID userId = UUID.randomUUID();
    private final UUID orgId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        UserPrincipal principal = new UserPrincipal(userId, "a@b.com", null, Collections.emptyList(), true);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    private UserOrgRole role(String role) {
        UserOrgRole r = new UserOrgRole();
        r.setRole(role);
        return r;
    }

    @Test
    void shouldBeMember_whenUserHasDirectRole() {
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(role("USER")));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(new Organization()));

        assertThat(tenantSecurity.isMemberOf(orgId)).isTrue();
        assertThat(tenantSecurity.hasRoleIn(orgId, "ADMIN")).isFalse();
    }

    @Test
    void shouldNotBeMember_whenUserHasNoRoleInOrgOrParent() {
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.empty());
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(new Organization()));

        assertThat(tenantSecurity.isMemberOf(orgId)).isFalse();
    }

    @Test
    void shouldInheritParentRole_whenOrgIsBranch() {
        UUID parentId = UUID.randomUUID();
        Organization branch = new Organization();
        branch.setParentOrganizationId(parentId);
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.empty());
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(branch));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentId))
                .thenReturn(Optional.of(role("ADMIN")));

        assertThat(tenantSecurity.hasRoleIn(orgId, "ADMIN")).isTrue();
    }

    @Test
    void shouldDenyAccess_whenDeactivatedHere_evenIfParentGrantsARole() {
        // A direct membership that was deactivated is a decision about this organization; the parent's role
        // must not quietly let the person back in.
        UserOrgRole deactivated = role("ADMIN");
        deactivated.setIsActive(false);
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(deactivated));

        assertThat(tenantSecurity.isMemberOf(orgId)).isFalse();
        verifyNoInteractions(organizationRepository);
    }

    @Test
    void shouldNotInheritParentRole_whenParentMembershipIsDeactivated() {
        UUID parentId = UUID.randomUUID();
        Organization branch = new Organization();
        branch.setParentOrganizationId(parentId);
        UserOrgRole deactivatedParent = role("OWNER");
        deactivatedParent.setIsActive(false);
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.empty());
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(branch));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentId))
                .thenReturn(Optional.of(deactivatedParent));

        assertThat(tenantSecurity.isMemberOf(orgId)).isFalse();
    }

    @Test
    void shouldReportEffectiveRole_includingInheritedParentRole() {
        UUID parentId = UUID.randomUUID();
        Organization branch = new Organization();
        branch.setParentOrganizationId(parentId);
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(role("USER")));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(branch));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentId))
                .thenReturn(Optional.of(role("ADMIN")));

        assertThat(tenantSecurity.currentRoleIn(orgId)).contains("ADMIN");
    }

    @Test
    void shouldReturnFalse_whenTenantHeaderIsNotAUuid() {
        TenantContext.setCurrentTenant("garbage");

        assertThat(tenantSecurity.isMember()).isFalse();
        verifyNoInteractions(userOrgRoleRepository);
    }

    @Test
    void shouldReturnFalse_whenUnauthenticated() {
        SecurityContextHolder.clearContext();

        assertThat(tenantSecurity.isMemberOf(orgId)).isFalse();
    }

    @Test
    void shouldResolveRoleOncePerRequest_acrossRepeatedChecks() {
        org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
                new org.springframework.web.context.request.ServletRequestAttributes(
                        new org.springframework.mock.web.MockHttpServletRequest()));
        try {
            when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId))
                    .thenReturn(Optional.of(role("OWNER")));

            assertThat(tenantSecurity.isMemberOf(orgId)).isTrue();
            assertThat(tenantSecurity.hasRoleIn(orgId, "ADMIN")).isTrue();
            assertThat(tenantSecurity.hasRoleIn(orgId, "OWNER")).isTrue();

            verify(userOrgRoleRepository, times(1)).findByUserIdAndOrganizationId(userId, orgId);
        } finally {
            org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
        }
    }
}
