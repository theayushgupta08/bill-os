package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.billos.api.dto.CreateMemberRequest;
import com.billos.api.dto.CreateMemberResponse;
import com.billos.api.dto.TeamMemberDto;
import com.billos.api.entity.Organization;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import com.billos.api.tenant.TenantContext;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TeamServiceTest {

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private SupabaseAdminService supabaseAdminService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TeamService teamService;

    private UUID orgId;
    private SecurityContext mockSecurityContext;
    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        TenantContext.setCurrentTenant(orgId.toString());
        ReflectionTestUtils.setField(teamService, "emailBaseDomain", "billos.app");

        mockSecurityContext = mock(SecurityContext.class);
        mockAuthentication = mock(Authentication.class);
        SecurityContextHolder.setContext(mockSecurityContext);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getTeamMembers - should map user isActive correctly to status")
    void getTeamMembers_shouldMapActiveStatusCorrectly() {
        // Arrange
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("user@example.com");
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setIsActive(false); // Inactive

        UserOrgRole role = new UserOrgRole();
        role.setOrganizationId(orgId);
        role.setUser(user);
        role.setRole("USER");

        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(role));

        // Act
        List<TeamMemberDto> members = teamService.getTeamMembers();

        // Assert
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getStatus()).isEqualTo("INACTIVE");
    }

    @Test
    @DisplayName("createMember - should auto-generate email, create in Supabase & billOS, and return credentials")
    void createMember_shouldSucceed() {
        // Arrange
        Organization org = new Organization();
        org.setId(orgId);
        org.setName("Acme Shop");
        org.setEmailSuffix("acmeshop");

        CreateMemberRequest request = new CreateMemberRequest();
        request.setFirstName("Rahul");
        request.setLastName("Sharma");
        request.setPhone("+91 9876543210");
        request.setRole("USER");

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        UUID generatedSupabaseId = UUID.randomUUID();
        when(supabaseAdminService.createUser(anyString(), anyString(), eq("Rahul"), eq("Sharma"), eq("+91 9876543210")))
                .thenReturn(generatedSupabaseId);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // Act
        CreateMemberResponse response = teamService.createMember(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getEmail()).startsWith("rahul.sharma.");
        assertThat(response.getEmail()).endsWith("@acmeshop.billos.app");
        assertThat(response.getGeneratedPassword()).hasSize(12);
        assertThat(response.getFirstName()).isEqualTo("Rahul");
        assertThat(response.getLastName()).isEqualTo("Sharma");
        assertThat(response.getRole()).isEqualTo("USER");

        verify(userRepository).save(any(User.class));
        verify(userOrgRoleRepository).save(any(UserOrgRole.class));
    }

    @Test
    @DisplayName("resetMemberPassword - Owner should successfully reset staff member password")
    void resetMemberPassword_shouldSucceed() {
        // Arrange
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID supabaseId = UUID.randomUUID();

        UserPrincipal principal =
                new UserPrincipal(callerId, "owner@example.com", "hash", Collections.emptyList(), true);
        when(mockSecurityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(principal);

        UserOrgRole callerRole = new UserOrgRole();
        callerRole.setRole("OWNER");

        User targetUser = new User();
        targetUser.setId(targetId);
        targetUser.setEmail("staff@example.com");
        targetUser.setSupabaseId(supabaseId);
        targetUser.setMustChangePassword(false);

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(callerId, orgId))
                .thenReturn(Optional.of(callerRole));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));

        // Act
        String newPassword = teamService.resetMemberPassword(targetId);

        // Assert
        assertThat(newPassword).hasSize(12);
        assertThat(targetUser.getMustChangePassword()).isTrue();
        verify(supabaseAdminService).updatePassword(eq(supabaseId), eq(newPassword));
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("toggleUserStatus - Owner should successfully deactivate Admin")
    void toggleUserStatus_OwnerDeactivatesAdmin() {
        // Arrange
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        UserPrincipal principal =
                new UserPrincipal(callerId, "owner@example.com", "hash", Collections.emptyList(), true);
        when(mockSecurityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(principal);

        UserOrgRole callerRole = new UserOrgRole();
        callerRole.setRole("OWNER");

        UserOrgRole targetRole = new UserOrgRole();
        targetRole.setRole("ADMIN");

        User targetUser = new User();
        targetUser.setId(targetId);
        targetUser.setIsActive(true);

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(callerId, orgId))
                .thenReturn(Optional.of(callerRole));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(targetId, orgId))
                .thenReturn(Optional.of(targetRole));
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));

        // Act
        teamService.toggleUserStatus(targetId, false);

        // Assert
        assertThat(targetUser.getIsActive()).isFalse();
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("toggleUserStatus - Admin cannot toggle Admin status (equal rank)")
    void toggleUserStatus_AdminCannotToggleAdmin() {
        // Arrange
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        UserPrincipal principal =
                new UserPrincipal(callerId, "admin1@example.com", "hash", Collections.emptyList(), true);
        when(mockSecurityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(principal);

        UserOrgRole callerRole = new UserOrgRole();
        callerRole.setRole("ADMIN");

        UserOrgRole targetRole = new UserOrgRole();
        targetRole.setRole("ADMIN");

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(callerId, orgId))
                .thenReturn(Optional.of(callerRole));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(targetId, orgId))
                .thenReturn(Optional.of(targetRole));

        // Act & Assert
        assertThatThrownBy(() -> teamService.toggleUserStatus(targetId, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("You do not have permission to change status of user with equal or higher role");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("toggleUserStatus - Manager cannot toggle anyone (unauthorized role)")
    void toggleUserStatus_ManagerCannotToggleUser() {
        // Arrange
        UUID callerId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        UserPrincipal principal =
                new UserPrincipal(callerId, "manager@example.com", "hash", Collections.emptyList(), true);
        when(mockSecurityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(principal);

        UserOrgRole callerRole = new UserOrgRole();
        callerRole.setRole("MANAGER");

        UserOrgRole targetRole = new UserOrgRole();
        targetRole.setRole("USER");

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(callerId, orgId))
                .thenReturn(Optional.of(callerRole));
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(targetId, orgId))
                .thenReturn(Optional.of(targetRole));

        // Act & Assert
        assertThatThrownBy(() -> teamService.toggleUserStatus(targetId, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Only Owner and Admin have permission to toggle user status");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("removeUser - should delete role for regular member")
    void removeUser_shouldDeleteRole() {
        UUID userId = UUID.randomUUID();
        UserOrgRole role = new UserOrgRole();
        role.setRole("USER");
        role.setOrganizationId(orgId);

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(role));

        teamService.removeUser(userId);

        verify(userOrgRoleRepository).delete(role);
    }

    @Test
    @DisplayName("removeUser - should throw exception when trying to remove last owner")
    void removeUser_lastOwner_throwsException() {
        UUID userId = UUID.randomUUID();
        UserOrgRole role = new UserOrgRole();
        role.setRole("OWNER");
        role.setOrganizationId(orgId);

        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(role));
        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(role));

        assertThatThrownBy(() -> teamService.removeUser(userId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot remove the last owner of the organization");

        verify(userOrgRoleRepository, never()).delete(any());
    }

    @Test
    @DisplayName("updateUserRole - should throw exception when trying to change role of organization creator")
    void updateUserRole_creatorRoleCannotBeChanged_throwsException() {
        UUID creatorId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        assertThatThrownBy(() -> teamService.updateUserRole(creatorId, "ADMIN"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot change role of the organization creator. The creator must remain OWNER.");

        verify(userOrgRoleRepository, never()).save(any(UserOrgRole.class));
    }

    @Test
    @DisplayName("removeUser - should throw exception when trying to remove organization creator")
    void removeUser_creatorCannotBeRemoved_throwsException() {
        UUID creatorId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        assertThatThrownBy(() -> teamService.removeUser(creatorId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Cannot remove the organization creator from the organization.");

        verify(userOrgRoleRepository, never()).delete(any());
    }

    @Test
    @DisplayName("toggleUserStatus - should throw exception when trying to deactivate organization creator")
    void toggleUserStatus_creatorCannotBeDeactivated_throwsException() {
        UUID creatorId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        assertThatThrownBy(() -> teamService.toggleUserStatus(creatorId, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining(
                        "Cannot change status of the organization creator. The creator cannot be made inactive.");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("getTeamMembers - should mark isCreator true for creator and false for others")
    void getTeamMembers_shouldSetIsCreatorFlag() {
        UUID creatorId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();

        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        User creatorUser = new User();
        creatorUser.setId(creatorId);
        creatorUser.setEmail("creator@example.com");
        creatorUser.setIsActive(true);

        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setEmail("other@example.com");
        otherUser.setIsActive(true);

        UserOrgRole creatorRole = new UserOrgRole();
        creatorRole.setOrganizationId(orgId);
        creatorRole.setUser(creatorUser);
        creatorRole.setRole("OWNER");

        UserOrgRole otherRole = new UserOrgRole();
        otherRole.setOrganizationId(orgId);
        otherRole.setUser(otherUser);
        otherRole.setRole("ADMIN");

        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(creatorRole, otherRole));

        List<TeamMemberDto> members = teamService.getTeamMembers();

        assertThat(members).hasSize(2);
        TeamMemberDto creatorDto = members.stream()
                .filter(m -> m.getUserId().equals(creatorId))
                .findFirst()
                .orElseThrow();
        TeamMemberDto otherDto = members.stream()
                .filter(m -> m.getUserId().equals(otherUserId))
                .findFirst()
                .orElseThrow();

        assertThat(creatorDto.getIsCreator()).isTrue();
        assertThat(otherDto.getIsCreator()).isFalse();
    }
}
