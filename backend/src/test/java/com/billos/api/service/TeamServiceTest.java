package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.billos.api.dto.InviteUserRequest;
import com.billos.api.dto.TeamMemberDto;
import com.billos.api.entity.Organization;
import com.billos.api.entity.OrganizationInvitation;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationInvitationRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TeamServiceTest {

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationInvitationRepository invitationRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private TeamService teamService;

    private UUID orgId;
    private SecurityContext mockSecurityContext;
    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        TenantContext.setCurrentTenant(orgId.toString());

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

        when(userOrgRoleRepository.findAll()).thenReturn(List.of(role));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Act
        List<TeamMemberDto> members = teamService.getTeamMembers();

        // Assert
        assertThat(members).hasSize(1);
        assertThat(members.get(0).getStatus()).isEqualTo("INACTIVE");
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
    @DisplayName("inviteUser - should create pending invitation, send email, and return token")
    void inviteUser_shouldCreateInvitationAndReturnToken() {
        // Arrange
        Organization org = new Organization();
        org.setId(orgId);
        org.setName("Acme Corp");

        InviteUserRequest request = new InviteUserRequest();
        request.setEmail("invitee@example.com");
        request.setRole("ADMIN");

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.empty());
        when(invitationRepository.findByOrganizationIdAndEmailAndStatus(orgId, "invitee@example.com", "PENDING"))
                .thenReturn(Optional.empty());

        // Act
        String token = teamService.inviteUser(request);

        // Assert
        assertThat(token).isNotBlank();
        verify(invitationRepository).save(any(OrganizationInvitation.class));
        verify(emailService)
                .sendOrganizationInvitation(eq("invitee@example.com"), eq("Acme Corp"), eq("ADMIN"), eq(token));
    }
}
