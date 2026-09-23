package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.CreateBranchRequest;
import com.billos.api.dto.OrganizationTreeDto;
import com.billos.api.entity.Organization;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationSeeder organizationSeeder;

    @Mock
    private OrganizationSettingsRepository organizationSettingsRepository;

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
        when(organizationRepository.saveAndFlush(orgInput)).thenReturn(savedOrg);
        doNothing().when(organizationSeeder).seedNewOrganization(any(UUID.class), any(User.class));

        // Act
        Organization result = organizationService.createOrganization(orgInput);

        // Assert
        assertThat(result.getId()).isEqualTo(orgId);
        assertThat(result.getName()).isEqualTo("Acme Corp");

        verify(organizationSeeder).seedNewOrganization(orgId, currentUser);
    }

    @Test
    @DisplayName("createOrganization - should ignore client-supplied id and parent to prevent hijacking")
    void createOrganization_shouldIgnoreClientSuppliedIdAndParent() {
        // Arrange — an attacker posts an existing org's id and a victim parent id
        Organization orgInput = new Organization();
        orgInput.setId(UUID.randomUUID());
        orgInput.setParentOrganizationId(UUID.randomUUID());
        orgInput.setIsPrimary(false);
        orgInput.setName("Evil Branch");

        Organization savedOrg = new Organization();
        savedOrg.setId(UUID.randomUUID());

        when(userRepository.findById(userId)).thenReturn(Optional.of(currentUser));
        when(organizationRepository.saveAndFlush(orgInput)).thenReturn(savedOrg);

        // Act
        organizationService.createOrganization(orgInput);

        // Assert — the entity handed to JPA is a fresh, standalone primary org
        assertThat(orgInput.getId()).isNull();
        assertThat(orgInput.getParentOrganizationId()).isNull();
        assertThat(orgInput.getIsPrimary()).isTrue();
        assertThat(orgInput.getCreatedBy()).isEqualTo(userId);
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
        assertThat(result).extracting(Organization::getName).containsExactly("Org One", "Org Two");
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

    @Test
    @DisplayName("createBranch - should create and seed branch when user is OWNER of parent")
    void createBranch_shouldCreateAndSeedBranchWhenUserIsOwner() {
        UUID parentOrgId = UUID.randomUUID();
        Organization parentOrg = new Organization();
        parentOrg.setId(parentOrgId);
        parentOrg.setName("Parent HQ");
        parentOrg.setIsPrimary(true);
        parentOrg.setCountry("India");

        CreateBranchRequest request = new CreateBranchRequest();
        request.setName("Mumbai Branch");
        request.setBranchCode("BOM-01");
        request.setPhone("+91 9876543210");
        request.setGstin("27AAAAA0000A1Z5");

        UserOrgRole parentRole = new UserOrgRole();
        parentRole.setOrganizationId(parentOrgId);
        parentRole.setUser(currentUser);
        parentRole.setRole("OWNER");

        UUID branchId = UUID.randomUUID();
        Organization savedBranch = new Organization();
        savedBranch.setId(branchId);
        savedBranch.setName("Mumbai Branch");
        savedBranch.setBranchCode("BOM-01");
        savedBranch.setParentOrganizationId(parentOrgId);
        savedBranch.setIsPrimary(false);

        when(userRepository.findById(userId)).thenReturn(Optional.of(currentUser));
        when(organizationRepository.findById(parentOrgId)).thenReturn(Optional.of(parentOrg));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentOrgId))
                .thenReturn(Optional.of(parentRole));
        when(organizationRepository.saveAndFlush(any(Organization.class))).thenReturn(savedBranch);
        doNothing().when(organizationSeeder).seedNewOrganization(eq(branchId), any(User.class));

        Organization result = organizationService.createBranch(parentOrgId, request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(branchId);
        assertThat(result.getParentOrganizationId()).isEqualTo(parentOrgId);
        assertThat(result.getIsPrimary()).isFalse();
        verify(organizationSeeder).seedNewOrganization(branchId, currentUser);
    }

    @Test
    @DisplayName("createBranch - should throw when user is not OWNER or ADMIN of parent")
    void createBranch_shouldThrowWhenUserNotAuthorized() {
        UUID parentOrgId = UUID.randomUUID();
        Organization parentOrg = new Organization();
        parentOrg.setId(parentOrgId);
        parentOrg.setName("Parent HQ");

        CreateBranchRequest request = new CreateBranchRequest();
        request.setName("Delhi Branch");
        request.setPhone("+91 9876543210");

        UserOrgRole parentRole = new UserOrgRole();
        parentRole.setOrganizationId(parentOrgId);
        parentRole.setUser(currentUser);
        parentRole.setRole("VIEWER");

        when(userRepository.findById(userId)).thenReturn(Optional.of(currentUser));
        when(organizationRepository.findById(parentOrgId)).thenReturn(Optional.of(parentOrg));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, parentOrgId))
                .thenReturn(Optional.of(parentRole));

        assertThatThrownBy(() -> organizationService.createBranch(parentOrgId, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Only an OWNER or ADMIN");
    }

    @Test
    @DisplayName("getOrganizationTree - should group primary and branch organizations correctly")
    void getOrganizationTree_shouldGroupPrimaryAndBranches() {
        UUID parentId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();

        UserOrgRole role = new UserOrgRole();
        role.setOrganizationId(parentId);
        role.setUser(currentUser);
        role.setRole("OWNER");

        Organization parentOrg = new Organization();
        parentOrg.setId(parentId);
        parentOrg.setName("Headquarters");
        parentOrg.setIsPrimary(true);

        Organization branchOrg = new Organization();
        branchOrg.setId(branchId);
        branchOrg.setName("Branch 1");
        branchOrg.setParentOrganizationId(parentId);
        branchOrg.setIsPrimary(false);

        when(userOrgRoleRepository.findByUserId(userId)).thenReturn(List.of(role));
        when(organizationRepository.findById(parentId)).thenReturn(Optional.of(parentOrg));
        when(organizationRepository.findByParentOrganizationId(parentId)).thenReturn(List.of(branchOrg));

        List<OrganizationTreeDto> tree = organizationService.getOrganizationTree();

        assertThat(tree).hasSize(1);
        assertThat(tree.get(0).getPrimaryOrganization().getId()).isEqualTo(parentId);
        assertThat(tree.get(0).getBranches()).hasSize(1);
        assertThat(tree.get(0).getBranches().get(0).getId()).isEqualTo(branchId);
    }

    @Test
    @DisplayName("resolvePrimaryOrgId - should return parent ID if current org is branch")
    void resolvePrimaryOrgId_shouldReturnParentIdForBranch() {
        UUID parentId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();

        Organization branch = new Organization();
        branch.setId(branchId);
        branch.setParentOrganizationId(parentId);
        branch.setIsPrimary(false);

        when(organizationRepository.findById(branchId)).thenReturn(Optional.of(branch));

        UUID resolved = organizationService.resolvePrimaryOrgId(branchId);

        assertThat(resolved).isEqualTo(parentId);
    }

    @Test
    @DisplayName("resolvePrimaryOrgId - should return self ID if current org is primary")
    void resolvePrimaryOrgId_shouldReturnSelfForPrimary() {
        UUID parentId = UUID.randomUUID();

        Organization parent = new Organization();
        parent.setId(parentId);
        parent.setParentOrganizationId(null);
        parent.setIsPrimary(true);

        when(organizationRepository.findById(parentId)).thenReturn(Optional.of(parent));

        UUID resolved = organizationService.resolvePrimaryOrgId(parentId);

        assertThat(resolved).isEqualTo(parentId);
    }
}
