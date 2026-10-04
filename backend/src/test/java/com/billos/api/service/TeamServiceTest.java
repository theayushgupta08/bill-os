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
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ForbiddenException;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.TenantSecurity;
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
    private TenantSecurity tenantSecurity;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private TeamService teamService;

    private UUID orgId;
    private UUID callerId;
    private SecurityContext mockSecurityContext;
    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        callerId = UUID.randomUUID();
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

    // ─── Team list ──────────────────────────────────────────────────

    @Test
    @DisplayName("getTeamMembers - an inactive user is shown as INACTIVE")
    void getTeamMembers_shouldMapActiveStatusCorrectly() {
        User user = user(UUID.randomUUID());
        user.setIsActive(false);
        UserOrgRole role = role(user, "USER", true);
        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(role));

        List<TeamMemberDto> members = teamService.getTeamMembers();

        assertThat(members).hasSize(1);
        assertThat(members.get(0).getStatus()).isEqualTo("INACTIVE");
    }

    @Test
    @DisplayName(
            "getTeamMembers - a member deactivated in this organization is INACTIVE even if their account is active")
    void getTeamMembers_shouldShowMembershipStatus() {
        UserOrgRole role = role(user(UUID.randomUUID()), "USER", false);
        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(role));

        assertThat(teamService.getTeamMembers().get(0).getStatus()).isEqualTo("INACTIVE");
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
        when(userOrgRoleRepository.findByOrganizationId(orgId))
                .thenReturn(List.of(role(user(creatorId), "OWNER", true), role(user(otherUserId), "ADMIN", true)));

        List<TeamMemberDto> members = teamService.getTeamMembers();

        assertThat(members).hasSize(2);
        assertThat(members.stream()
                        .filter(m -> m.getUserId().equals(creatorId))
                        .findFirst()
                        .orElseThrow()
                        .getIsCreator())
                .isTrue();
        assertThat(members.stream()
                        .filter(m -> m.getUserId().equals(otherUserId))
                        .findFirst()
                        .orElseThrow()
                        .getIsCreator())
                .isFalse();
    }

    // ─── Create member ──────────────────────────────────────────────

    @Test
    @DisplayName("createMember - should auto-generate email, create in Supabase & billOS, and return credentials")
    void createMember_shouldSucceed() {
        callerIs("ADMIN");
        Organization org = new Organization();
        org.setId(orgId);
        org.setName("Acme Shop");
        org.setEmailSuffix("acmeshop");
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

        CreateMemberResponse response = teamService.createMember(memberRequest("USER"));

        assertThat(response.getEmail()).startsWith("rahul.sharma.").endsWith("@acmeshop.billos.app");
        assertThat(response.getGeneratedPassword()).hasSize(12);
        assertThat(response.getRole()).isEqualTo("USER");
        verify(userRepository).save(any(User.class));
        verify(userOrgRoleRepository).save(argThat(r -> r.getOrganizationId().equals(orgId) && r.isActiveMembership()));
    }

    @Test
    @DisplayName("createMember - an admin cannot create an owner account")
    void createMember_adminCannotCreateOwner() {
        callerIs("ADMIN");

        assertThatThrownBy(() -> teamService.createMember(memberRequest("OWNER")))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(supabaseAdminService);
        verify(userOrgRoleRepository, never()).save(any());
    }

    @Test
    @DisplayName("createMember - rejects a role that doesn't exist")
    void createMember_rejectsUnknownRole() {
        callerIs("OWNER");

        assertThatThrownBy(() -> teamService.createMember(memberRequest("SUPERUSER")))
                .isInstanceOf(BadRequestException.class);

        verifyNoInteractions(supabaseAdminService);
    }

    // ─── Reset password ─────────────────────────────────────────────

    @Test
    @DisplayName("resetMemberPassword - an owner resets a staff member's password")
    void resetMemberPassword_shouldSucceed() {
        signedIn();
        callerIs("OWNER");
        UUID targetId = UUID.randomUUID();
        UUID supabaseId = UUID.randomUUID();
        member(targetId, "USER", true);
        User targetUser = user(targetId);
        targetUser.setSupabaseId(supabaseId);
        targetUser.setMustChangePassword(false);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));

        String newPassword = teamService.resetMemberPassword(targetId);

        assertThat(newPassword).hasSize(12);
        assertThat(targetUser.getMustChangePassword()).isTrue();
        verify(supabaseAdminService).updatePassword(eq(supabaseId), eq(newPassword));
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("resetMemberPassword - refuses a user who isn't a member of this organization")
    void resetMemberPassword_shouldRefuseUserOutsideOrganization() {
        // Regression: an OWNER/ADMIN of any organization (anyone can create one) could reset — and receive — the
        // password of any user in the system, given their id.
        signedIn();
        callerIs("OWNER");
        UUID outsiderId = UUID.randomUUID();
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(outsiderId, orgId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.resetMemberPassword(outsiderId)).isInstanceOf(BadRequestException.class);

        verifyNoInteractions(supabaseAdminService);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("resetMemberPassword - an admin cannot reset an owner's password")
    void resetMemberPassword_adminCannotResetOwner() {
        signedIn();
        callerIs("ADMIN");
        UUID ownerId = UUID.randomUUID();
        member(ownerId, "OWNER", true);

        assertThatThrownBy(() -> teamService.resetMemberPassword(ownerId)).isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(supabaseAdminService);
    }

    @Test
    @DisplayName("resetMemberPassword - an owner cannot reset another owner's password")
    void resetMemberPassword_ownerCannotResetAnotherOwner() {
        signedIn();
        callerIs("OWNER");
        UUID otherOwnerId = UUID.randomUUID();
        member(otherOwnerId, "OWNER", true);

        assertThatThrownBy(() -> teamService.resetMemberPassword(otherOwnerId)).isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(supabaseAdminService);
    }

    // ─── Roles ──────────────────────────────────────────────────────

    @Test
    @DisplayName("updateUserRole - an owner promotes a user to admin")
    void updateUserRole_ownerPromotesUser() {
        signedIn();
        callerIs("OWNER");
        UUID targetId = UUID.randomUUID();
        UserOrgRole target = member(targetId, "USER", true);

        teamService.updateUserRole(targetId, "ADMIN");

        assertThat(target.getRole()).isEqualTo("ADMIN");
        verify(userOrgRoleRepository).save(target);
    }

    @Test
    @DisplayName("updateUserRole - an admin cannot grant the owner role")
    void updateUserRole_adminCannotGrantOwner() {
        signedIn();
        callerIs("ADMIN");

        assertThatThrownBy(() -> teamService.updateUserRole(UUID.randomUUID(), "OWNER"))
                .isInstanceOf(ForbiddenException.class);

        verify(userOrgRoleRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUserRole - an admin cannot change another admin")
    void updateUserRole_adminCannotChangeAnotherAdmin() {
        signedIn();
        callerIs("ADMIN");
        UUID otherAdminId = UUID.randomUUID();
        member(otherAdminId, "ADMIN", true);

        assertThatThrownBy(() -> teamService.updateUserRole(otherAdminId, "VIEWER"))
                .isInstanceOf(ForbiddenException.class);

        verify(userOrgRoleRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUserRole - nobody can change their own role")
    void updateUserRole_cannotChangeOwnRole() {
        signedIn();

        assertThatThrownBy(() -> teamService.updateUserRole(callerId, "OWNER")).isInstanceOf(BadRequestException.class);

        verify(userOrgRoleRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUserRole - should throw exception when trying to change role of organization creator")
    void updateUserRole_creatorRoleCannotBeChanged_throwsException() {
        signedIn();
        callerIs("OWNER");
        UUID creatorId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        assertThatThrownBy(() -> teamService.updateUserRole(creatorId, "ADMIN"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Cannot change role of the organization creator. The creator must remain OWNER.");

        verify(userOrgRoleRepository, never()).save(any(UserOrgRole.class));
    }

    // ─── Remove ─────────────────────────────────────────────────────

    @Test
    @DisplayName("removeUser - an admin removes a regular member")
    void removeUser_shouldDeleteRole() {
        signedIn();
        callerIs("ADMIN");
        UUID userId = UUID.randomUUID();
        UserOrgRole role = member(userId, "USER", true);

        teamService.removeUser(userId);

        verify(userOrgRoleRepository).delete(role);
    }

    @Test
    @DisplayName("removeUser - an admin cannot remove an owner")
    void removeUser_adminCannotRemoveOwner() {
        signedIn();
        callerIs("ADMIN");
        UUID ownerId = UUID.randomUUID();
        member(ownerId, "OWNER", true);

        assertThatThrownBy(() -> teamService.removeUser(ownerId)).isInstanceOf(ForbiddenException.class);

        verify(userOrgRoleRepository, never()).delete(any());
    }

    @Test
    @DisplayName("removeUser - should throw exception when trying to remove last owner")
    void removeUser_lastOwner_throwsException() {
        signedIn();
        callerIs("OWNER");
        UUID userId = UUID.randomUUID();
        UserOrgRole role = member(userId, "OWNER", true);
        when(userOrgRoleRepository.findByOrganizationId(orgId)).thenReturn(List.of(role));

        assertThatThrownBy(() -> teamService.removeUser(userId))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Cannot remove the last owner of the organization");

        verify(userOrgRoleRepository, never()).delete(any());
    }

    @Test
    @DisplayName("removeUser - should throw exception when trying to remove organization creator")
    void removeUser_creatorCannotBeRemoved_throwsException() {
        signedIn();
        callerIs("OWNER");
        UUID creatorId = UUID.randomUUID();
        Organization org = new Organization();
        org.setId(orgId);
        org.setCreatedBy(creatorId);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        assertThatThrownBy(() -> teamService.removeUser(creatorId))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Cannot remove the organization creator from the organization.");

        verify(userOrgRoleRepository, never()).delete(any());
    }

    // ─── Status ─────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleUserStatus - deactivating someone's only membership disables their account too")
    void toggleUserStatus_OwnerDeactivatesAdmin() {
        signedIn();
        callerIs("OWNER");
        UUID targetId = UUID.randomUUID();
        UserOrgRole targetRole = member(targetId, "ADMIN", true);
        User targetUser = user(targetId);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(userOrgRoleRepository.findByUserId(targetId)).thenReturn(List.of(targetRole));

        teamService.toggleUserStatus(targetId, false);

        assertThat(targetRole.isActiveMembership()).isFalse();
        assertThat(targetUser.getIsActive()).isFalse();
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("toggleUserStatus - deactivating a member here leaves their other organizations alone")
    void toggleUserStatus_shouldNotLockUserOutOfOtherOrganizations() {
        // Regression: deactivation flipped the global users.is_active flag (and banned the Supabase login), so one
        // organization's admin could cut a person off from every other organization they belong to.
        signedIn();
        callerIs("OWNER");
        UUID targetId = UUID.randomUUID();
        UserOrgRole here = member(targetId, "USER", true);
        UserOrgRole elsewhere = new UserOrgRole();
        elsewhere.setOrganizationId(UUID.randomUUID());
        elsewhere.setRole("OWNER");
        User targetUser = user(targetId);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(userOrgRoleRepository.findByUserId(targetId)).thenReturn(List.of(here, elsewhere));

        teamService.toggleUserStatus(targetId, false);

        assertThat(here.isActiveMembership()).isFalse();
        assertThat(targetUser.getIsActive()).isTrue();
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    @DisplayName("toggleUserStatus - reactivating a member re-enables a disabled account")
    void toggleUserStatus_reactivationEnablesAccount() {
        signedIn();
        callerIs("OWNER");
        UUID targetId = UUID.randomUUID();
        UserOrgRole here = member(targetId, "USER", false);
        User targetUser = user(targetId);
        targetUser.setIsActive(false);
        when(userRepository.findById(targetId)).thenReturn(Optional.of(targetUser));
        when(userOrgRoleRepository.findByUserId(targetId)).thenReturn(List.of(here));

        teamService.toggleUserStatus(targetId, true);

        assertThat(here.isActiveMembership()).isTrue();
        assertThat(targetUser.getIsActive()).isTrue();
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("toggleUserStatus - Admin cannot toggle Admin status (equal rank)")
    void toggleUserStatus_AdminCannotToggleAdmin() {
        signedIn();
        callerIs("ADMIN");
        UUID targetId = UUID.randomUUID();
        member(targetId, "ADMIN", true);

        assertThatThrownBy(() -> teamService.toggleUserStatus(targetId, false))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("You do not have permission to change status of user with equal or higher role");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("toggleUserStatus - Manager cannot toggle anyone (unauthorized role)")
    void toggleUserStatus_ManagerCannotToggleUser() {
        signedIn();
        callerIs("MANAGER");

        assertThatThrownBy(() -> teamService.toggleUserStatus(UUID.randomUUID(), false))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only Owner and Admin have permission to toggle user status");

        verify(userRepository, never()).save(any(User.class));
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
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining(
                        "Cannot change status of the organization creator. The creator cannot be made inactive.");

        verify(userRepository, never()).save(any(User.class));
    }

    // ─── Helpers ────────────────────────────────────────────────────

    private void signedIn() {
        UserPrincipal principal =
                new UserPrincipal(callerId, "caller@example.com", "hash", Collections.emptyList(), true);
        when(mockSecurityContext.getAuthentication()).thenReturn(mockAuthentication);
        when(mockAuthentication.getPrincipal()).thenReturn(principal);
    }

    private void callerIs(String role) {
        when(tenantSecurity.currentRoleIn(orgId)).thenReturn(Optional.of(role));
    }

    private UserOrgRole member(UUID userId, String role, boolean active) {
        UserOrgRole membership = role(user(userId), role, active);
        when(userOrgRoleRepository.findByUserIdAndOrganizationId(userId, orgId)).thenReturn(Optional.of(membership));
        return membership;
    }

    private UserOrgRole role(User user, String role, boolean active) {
        UserOrgRole membership = new UserOrgRole();
        membership.setOrganizationId(orgId);
        membership.setUser(user);
        membership.setRole(role);
        membership.setIsActive(active);
        return membership;
    }

    private User user(UUID id) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFirstName("First");
        user.setLastName("Last");
        user.setIsActive(true);
        return user;
    }

    private CreateMemberRequest memberRequest(String role) {
        CreateMemberRequest request = new CreateMemberRequest();
        request.setFirstName("Rahul");
        request.setLastName("Sharma");
        request.setPhone("+91 9876543210");
        request.setRole(role);
        return request;
    }
}
