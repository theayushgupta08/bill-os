package com.billos.api.service;

import com.billos.api.entity.Organization;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrganizationService organizationService;

    private UUID userId;
    private User currentUser;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        currentUser = new User();
        currentUser.setId(userId);
        currentUser.setEmail("owner@example.com");
        currentUser.setFirstName("Owner");
        currentUser.setLastName("User");
        currentUser.setPasswordHash("hashed");

        principal = UserPrincipal.create(currentUser);

        // Set security context
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("createOrganization - should save org and assign OWNER role")
    void createOrganization_shouldSaveOrgAndAssignOwnerRole() {
        // Arrange
        Organization orgInput = new Organization();
        orgInput.setName("Acme Corp");
        orgInput.setGstin("29ABCDE1234F1Z5");

        UUID orgId = UUID.randomUUID();
        Organization savedOrg = new Organization();
        savedOrg.setId(orgId);
        savedOrg.setName("Acme Corp");
        savedOrg.setGstin("29ABCDE1234F1Z5");

        when(userRepository.findById(userId)).thenReturn(Optional.of(currentUser));
        when(organizationRepository.save(orgInput)).thenReturn(savedOrg);
        when(userOrgRoleRepository.save(any(UserOrgRole.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        Organization result = organizationService.createOrganization(orgInput);

        // Assert
        assertThat(result.getId()).isEqualTo(orgId);
        assertThat(result.getName()).isEqualTo("Acme Corp");

        verify(userOrgRoleRepository).save(argThat(role -> {
            assertThat(role.getUser()).isEqualTo(currentUser);
            assertThat(role.getOrganizationId()).isEqualTo(orgId);
            assertThat(role.getRole()).isEqualTo("OWNER");
            return true;
        }));
    }

    @Test
    @DisplayName("createOrganization - should throw if user not found in DB")
    void createOrganization_shouldThrowIfUserNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        Organization orgInput = new Organization();
        orgInput.setName("Ghost Org");

        // Act & Assert
        assertThatThrownBy(() -> organizationService.createOrganization(orgInput))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    @DisplayName("getMyOrganizations - should return orgs for current user")
    void getMyOrganizations_shouldReturnOrgsForCurrentUser() {
        // Arrange
        UUID orgId1 = UUID.randomUUID();
        UUID orgId2 = UUID.randomUUID();

        UserOrgRole role1 = new UserOrgRole();
        role1.setOrganizationId(orgId1);
        role1.setRole("OWNER");

        UserOrgRole role2 = new UserOrgRole();
        role2.setOrganizationId(orgId2);
        role2.setRole("ADMIN");

        Organization org1 = new Organization();
        org1.setId(orgId1);
        org1.setName("Org One");

        Organization org2 = new Organization();
        org2.setId(orgId2);
        org2.setName("Org Two");

        when(userOrgRoleRepository.findByUserId(userId)).thenReturn(List.of(role1, role2));
        when(organizationRepository.findById(orgId1)).thenReturn(Optional.of(org1));
        when(organizationRepository.findById(orgId2)).thenReturn(Optional.of(org2));

        // Act
        List<Organization> result = organizationService.getMyOrganizations();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result).extracting(Organization::getName)
                .containsExactly("Org One", "Org Two");
    }

    @Test
    @DisplayName("getMyOrganizations - should return empty list when user has no orgs")
    void getMyOrganizations_shouldReturnEmptyWhenNoOrgs() {
        // Arrange
        when(userOrgRoleRepository.findByUserId(userId)).thenReturn(Collections.emptyList());

        // Act
        List<Organization> result = organizationService.getMyOrganizations();

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("getMyOrganizations - should filter out deleted/null organizations")
    void getMyOrganizations_shouldFilterOutNullOrgs() {
        // Arrange
        UUID orgId = UUID.randomUUID();
        UUID deletedOrgId = UUID.randomUUID();

        UserOrgRole role1 = new UserOrgRole();
        role1.setOrganizationId(orgId);

        UserOrgRole role2 = new UserOrgRole();
        role2.setOrganizationId(deletedOrgId);

        Organization org1 = new Organization();
        org1.setId(orgId);
        org1.setName("Existing Org");

        when(userOrgRoleRepository.findByUserId(userId)).thenReturn(List.of(role1, role2));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org1));
        when(organizationRepository.findById(deletedOrgId)).thenReturn(Optional.empty()); // soft-deleted

        // Act
        List<Organization> result = organizationService.getMyOrganizations();

        // Assert
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Existing Org");
    }
}
