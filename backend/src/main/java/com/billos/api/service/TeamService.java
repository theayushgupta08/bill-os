package com.billos.api.service;

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
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TeamService {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final UserRepository userRepository;
    private final OrganizationInvitationRepository invitationRepository;
    private final OrganizationRepository organizationRepository;
    private final EmailService emailService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<TeamMemberDto> getTeamMembers() {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        List<TeamMemberDto> team = new ArrayList<>();

        // Add active users
        List<UserOrgRole> roles = userOrgRoleRepository.findAll(); // We should filter by orgId
        for (UserOrgRole role : roles) {
            if (role.getOrganizationId().equals(orgId)) {
                User user = userRepository.findById(role.getUser().getId()).orElse(null);
                if (user != null) {
                    team.add(new TeamMemberDto(
                            user.getId(),
                            user.getEmail(),
                            user.getFirstName(),
                            user.getLastName(),
                            role.getRole(),
                            Boolean.TRUE.equals(user.getIsActive()) ? "ACTIVE" : "INACTIVE"));
                }
            }
        }

        // Add pending invitations
        List<OrganizationInvitation> invitations = invitationRepository.findByOrganizationId(orgId);
        for (OrganizationInvitation inv : invitations) {
            if ("PENDING".equals(inv.getStatus()) && inv.getExpiresAt().isAfter(ZonedDateTime.now())) {
                team.add(new TeamMemberDto(null, inv.getEmail(), null, null, inv.getRole(), "INVITED"));
            }
        }

        return team;
    }

    @Transactional
    public void inviteUser(InviteUserRequest request) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Organization org = organizationRepository
                .findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Check if user is already in the org
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            Optional<UserOrgRole> role = userOrgRoleRepository.findByUserIdAndOrganizationId(
                    existingUser.get().getId(), orgId);
            if (role.isPresent()) {
                throw new RuntimeException("User is already a member of this organization");
            }
        }

        // Check if there's already a pending invitation
        Optional<OrganizationInvitation> existingInvite =
                invitationRepository.findByOrganizationIdAndEmailAndStatus(orgId, request.getEmail(), "PENDING");

        if (existingInvite.isPresent() && existingInvite.get().getExpiresAt().isAfter(ZonedDateTime.now())) {
            throw new RuntimeException("A pending invitation already exists for this email");
        }

        // Create new invitation
        OrganizationInvitation invitation = new OrganizationInvitation();
        invitation.setOrganizationId(orgId);
        invitation.setEmail(request.getEmail());
        invitation.setRole(request.getRole());
        invitation.setToken(UUID.randomUUID().toString());
        invitation.setExpiresAt(ZonedDateTime.now().plusDays(7));
        invitation.setStatus("PENDING");

        invitationRepository.save(invitation);

        // Send Email
        emailService.sendOrganizationInvitation(
                request.getEmail(), org.getName(), request.getRole(), invitation.getToken());
    }

    @Transactional
    public void acceptInvitation(String token) {
        OrganizationInvitation invitation = invitationRepository
                .findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (!"PENDING".equals(invitation.getStatus())
                || invitation.getExpiresAt().isBefore(ZonedDateTime.now())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation has expired or is invalid");
        }

        // Check if current user email matches invitation email
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!principal.getEmail().equalsIgnoreCase(invitation.getEmail())) {
            throw new RuntimeException("This invitation was sent to a different email address");
        }

        User user =
                userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        // Assign role
        UserOrgRole role = new UserOrgRole();
        role.setUser(user);
        role.setOrganizationId(invitation.getOrganizationId());
        role.setRole(invitation.getRole());
        userOrgRoleRepository.save(role);

        // Mark as accepted
        invitation.setStatus("ACCEPTED");
        invitationRepository.save(invitation);
    }

    @Transactional
    public void updateUserRole(UUID userId, String newRole) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        UserOrgRole role = userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this organization"));

        // Prevent changing the role of the last OWNER
        if ("OWNER".equals(role.getRole()) && !"OWNER".equals(newRole)) {
            long ownerCount = userOrgRoleRepository.findAll().stream()
                    .filter(r -> r.getOrganizationId().equals(orgId) && "OWNER".equals(r.getRole()))
                    .count();
            if (ownerCount <= 1) {
                throw new RuntimeException("Cannot change role of the last owner");
            }
        }

        role.setRole(newRole);
        userOrgRoleRepository.save(role);
    }

    @Transactional
    public void removeUser(UUID userId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        UserOrgRole role = userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this organization"));

        // Prevent removing the last OWNER
        if ("OWNER".equals(role.getRole())) {
            long ownerCount = userOrgRoleRepository.findAll().stream()
                    .filter(r -> r.getOrganizationId().equals(orgId) && "OWNER".equals(r.getRole()))
                    .count();
            if (ownerCount <= 1) {
                throw new RuntimeException("Cannot remove the last owner of the organization");
            }
        }

        userOrgRoleRepository.delete(role);
    }

    @Transactional
    public void toggleUserStatus(UUID targetUserId, boolean active) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        // Get caller info
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UUID callerId = principal.getId();

        UserOrgRole callerOrgRole = userOrgRoleRepository
                .findByUserIdAndOrganizationId(callerId, orgId)
                .orElseThrow(() -> new RuntimeException("Caller is not a member of this organization"));

        UserOrgRole targetOrgRole = userOrgRoleRepository
                .findByUserIdAndOrganizationId(targetUserId, orgId)
                .orElseThrow(() -> new RuntimeException("Target user is not a member of this organization"));

        List<String> hierarchy = List.of("OWNER", "ADMIN", "MANAGER", "USER", "VIEWER");

        String callerRole = callerOrgRole.getRole();
        String targetRole = targetOrgRole.getRole();

        int callerLevel = hierarchy.indexOf(callerRole);
        int targetLevel = hierarchy.indexOf(targetRole);

        if (callerLevel == -1 || targetLevel == -1) {
            throw new RuntimeException("Invalid role found");
        }

        if (callerId.equals(targetUserId)) {
            throw new RuntimeException("You cannot change the status of your own account");
        }

        // Only OWNER and ADMIN can perform toggles
        if (!"OWNER".equals(callerRole) && !"ADMIN".equals(callerRole)) {
            throw new RuntimeException("Only Owner and Admin have permission to toggle user status");
        }

        // Can only toggle strictly lower roles
        if (callerLevel >= targetLevel) {
            throw new RuntimeException("You do not have permission to change status of user with equal or higher role");
        }

        User targetUser =
                userRepository.findById(targetUserId).orElseThrow(() -> new RuntimeException("User not found"));

        targetUser.setIsActive(active);

        // Terminate sessions and manage Supabase login access
        UUID supabaseId = targetUser.getSupabaseId();
        if (supabaseId == null && targetUser.getEmail() != null) {
            try {
                List<UUID> ids = jdbcTemplate.query(
                        "SELECT id FROM auth.users WHERE LOWER(email) = LOWER(?)",
                        (rs, rowNum) -> UUID.fromString(rs.getString("id")),
                        targetUser.getEmail().trim());
                if (!ids.isEmpty()) {
                    supabaseId = ids.get(0);
                    targetUser.setSupabaseId(supabaseId);
                }
            } catch (Exception e) {
                log.warn("Could not lookup Supabase ID by email for {}: {}", targetUser.getEmail(), e.getMessage());
            }
        }

        if (supabaseId != null) {
            if (!active) {
                try {
                    // Immediately delete all active sessions across all devices
                    jdbcTemplate.update("DELETE FROM auth.sessions WHERE user_id = ?", supabaseId);
                    // Delete all refresh tokens
                    jdbcTemplate.update("DELETE FROM auth.refresh_tokens WHERE user_id = ?", supabaseId);
                    // Ban in Supabase GoTrue Auth to forbid future logins
                    jdbcTemplate.update(
                            "UPDATE auth.users SET banned_until = '2999-12-31 23:59:59+00' WHERE id = ?", supabaseId);
                    log.info(
                            "Terminated all sessions and banned Supabase user {} ({})",
                            supabaseId,
                            targetUser.getEmail());
                } catch (Exception e) {
                    log.error("Failed to revoke Supabase sessions or ban user {}: {}", supabaseId, e.getMessage());
                }
            } else {
                try {
                    // Unban user in Supabase GoTrue Auth so user can log in again
                    jdbcTemplate.update("UPDATE auth.users SET banned_until = NULL WHERE id = ?", supabaseId);
                    log.info("Lifted Supabase ban for user {} ({})", supabaseId, targetUser.getEmail());
                } catch (Exception e) {
                    log.error("Failed to clear Supabase ban for user {}: {}", supabaseId, e.getMessage());
                }
            }
        }

        userRepository.save(targetUser);
    }
}
