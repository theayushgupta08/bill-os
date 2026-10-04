package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.CreateMemberRequest;
import com.billos.api.dto.CreateMemberResponse;
import com.billos.api.dto.TeamMemberDto;
import com.billos.api.entity.Organization;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ForbiddenException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.Roles;
import com.billos.api.security.TenantSecurity;
import com.billos.api.security.UserPrincipal;
import com.billos.api.tenant.TenantContext;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
    private final OrganizationRepository organizationRepository;
    private final SupabaseAdminService supabaseAdminService;
    private final TenantSecurity tenantSecurity;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.email.base-domain:billos.app}")
    private String emailBaseDomain;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

    // ─── Team Members ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TeamMemberDto> getTeamMembers() {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        List<TeamMemberDto> team = new ArrayList<>();

        // UserOrgRole has no @TenantId, so query by org explicitly (findAll() would load every tenant's roles)
        List<UserOrgRole> roles = userOrgRoleRepository.findByOrganizationId(orgId);
        java.util.Map<UUID, java.time.OffsetDateTime> lastSignIns = fetchLastSignIns(roles.stream()
                .map(UserOrgRole::getUser)
                .filter(u -> u != null && u.getSupabaseId() != null)
                .map(User::getSupabaseId)
                .toList());

        for (UserOrgRole role : roles) {
            User user = role.getUser();
            if (user == null) {
                continue;
            }
            boolean isCreator = creatorId != null && creatorId.equals(user.getId());
            java.time.OffsetDateTime lastActive = lastSignIns.getOrDefault(
                    user.getSupabaseId(), user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt());
            team.add(TeamMemberDto.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(role.getRole())
                    .status(
                            role.isActiveMembership() && Boolean.TRUE.equals(user.getIsActive())
                                    ? "ACTIVE"
                                    : "INACTIVE")
                    .lastActiveAt(lastActive)
                    .isCreator(isCreator)
                    .build());
        }

        return team;
    }

    /** Last Supabase sign-in per auth user id, in one query rather than one per team member. */
    private java.util.Map<UUID, java.time.OffsetDateTime> fetchLastSignIns(List<UUID> supabaseIds) {
        java.util.Map<UUID, java.time.OffsetDateTime> result = new java.util.HashMap<>();
        if (supabaseIds.isEmpty() || jdbcTemplate == null) {
            return result;
        }
        String placeholders = String.join(",", java.util.Collections.nCopies(supabaseIds.size(), "?"));
        try {
            jdbcTemplate.query(
                    "SELECT id, last_sign_in_at FROM auth.users WHERE last_sign_in_at IS NOT NULL AND id IN ("
                            + placeholders + ")",
                    rs -> {
                        result.put(
                                rs.getObject("id", UUID.class),
                                rs.getObject("last_sign_in_at", java.time.OffsetDateTime.class));
                    },
                    supabaseIds.toArray());
        } catch (Exception ignored) {
            // Supabase auth schema may not exist in test environments
        }
        return result;
    }

    // ─── Create Member (Owner-Created Account) ──────────────────────

    @Transactional
    @Audited(entity = "TeamMember", action = "CREATE")
    public CreateMemberResponse createMember(CreateMemberRequest request) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        requireAssignable(callerRole(orgId), request.getRole());

        // Resolve the email suffix — use primary org's suffix (branches inherit)
        Organization org = organizationRepository
                .findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String suffix = org.getEmailSuffix();
        if (suffix == null && org.getParentOrganizationId() != null) {
            Organization parent = organizationRepository
                    .findById(org.getParentOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent organization not found"));
            suffix = parent.getEmailSuffix();
        }
        if (suffix == null || suffix.isBlank()) {
            // Auto-generate a safe unique fallback suffix for legacy organizations so member creation never fails
            String base = org.getName() != null ? org.getName().toLowerCase().replaceAll("[^a-z0-9]", "") : "org";
            if (base.isBlank()) {
                base = "org" + org.getId().toString().substring(0, 4);
            }
            if (base.length() > 20) {
                base = base.substring(0, 20);
            }
            String candidate = base;
            int counter = 1;
            while (organizationRepository.existsByEmailSuffix(candidate)) {
                candidate = base + counter++;
            }
            suffix = candidate;
            org.setEmailSuffix(suffix);
            organizationRepository.save(org);
            log.info("Auto-assigned fallback email suffix '{}' to organization {}", suffix, orgId);
        }

        // Generate email: firstname.lastname.XX@suffix.billos.app
        String email = generateUniqueEmail(request.getFirstName(), request.getLastName(), suffix);

        // Generate secure password
        String password = generatePassword(12);

        // Create user in Supabase Auth
        UUID supabaseId = supabaseAdminService.createUser(
                email, password, request.getFirstName(), request.getLastName(), request.getPhone());

        // Create user in billOS database
        User user = new User();
        user.setEmail(email);
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhone(request.getPhone());
        user.setSupabaseId(supabaseId);
        user.setIsActive(true);
        user.setIsEmailVerified(true);
        user.setMustChangePassword(true);
        user = userRepository.save(user);

        // Assign org role
        UserOrgRole role = new UserOrgRole();
        role.setUser(user);
        role.setOrganizationId(orgId);
        role.setRole(request.getRole());
        role.setIsActive(true);
        userOrgRoleRepository.save(role);

        log.info("Created member {} ({}) in org {} with role {}", user.getId(), email, orgId, request.getRole());

        return CreateMemberResponse.builder()
                .userId(user.getId().toString())
                .email(email)
                .generatedPassword(password)
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(request.getRole())
                .build();
    }

    // ─── Reset Member Password ──────────────────────────────────────

    @Transactional
    @Audited(entity = "TeamMember", action = "RESET_PASSWORD")
    public String resetMemberPassword(UUID targetUserId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String callerRole = callerRole(orgId);
        if (!Roles.satisfies(callerRole, Roles.ADMIN)) {
            throw new ForbiddenException("Only OWNER or ADMIN can reset passwords");
        }

        if (principal.getId().equals(targetUserId)) {
            throw new BadRequestException("Use the change-password flow to change your own password");
        }

        // The password comes back in the response, so this must only ever reach a member of this organization
        // whom the caller outranks — otherwise it is an account takeover of any user whose id is known.
        UserOrgRole targetRole = membership(targetUserId, orgId);
        if (!Roles.outranks(callerRole, targetRole.getRole())) {
            throw new ForbiddenException("You can only reset passwords for members below your own role");
        }

        User target = userRepository
                .findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (target.getSupabaseId() == null) {
            throw new BadRequestException("User does not have a Supabase auth account");
        }

        String newPassword = generatePassword(12);
        supabaseAdminService.updatePassword(target.getSupabaseId(), newPassword);
        target.setMustChangePassword(true);
        userRepository.save(target);

        log.info("Reset password for user {} ({}) by admin {}", targetUserId, target.getEmail(), principal.getId());
        return newPassword;
    }

    // ─── Role Management ────────────────────────────────────────────

    @Transactional
    @Audited(entity = "TeamMember", action = "CHANGE_ROLE")
    public void updateUserRole(UUID userId, String newRole) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        if (currentUserId().equals(userId)) {
            throw new BadRequestException("You can't change your own role");
        }
        String callerRole = callerRole(orgId);
        requireAssignable(callerRole, newRole);

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(userId)) {
            throw new ConflictException(
                    "Cannot change role of the organization creator. The creator must remain OWNER.");
        }

        UserOrgRole role = membership(userId, orgId);
        requireManageable(callerRole, role.getRole());

        if ("OWNER".equals(role.getRole()) && !"OWNER".equals(newRole)) {
            long ownerCount = userOrgRoleRepository.findByOrganizationId(orgId).stream()
                    .filter(r -> "OWNER".equals(r.getRole()))
                    .count();
            if (ownerCount <= 1) {
                throw new ConflictException("Cannot change role of the last owner");
            }
        }

        role.setRole(newRole);
        userOrgRoleRepository.save(role);
    }

    // ─── Remove User ────────────────────────────────────────────────

    @Transactional
    @Audited(entity = "TeamMember", action = "REMOVE")
    public void removeUser(UUID userId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        if (currentUserId().equals(userId)) {
            throw new BadRequestException("You can't remove yourself from the organization");
        }
        String callerRole = callerRole(orgId);

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(userId)) {
            throw new ConflictException("Cannot remove the organization creator from the organization.");
        }

        UserOrgRole role = membership(userId, orgId);
        requireManageable(callerRole, role.getRole());

        if ("OWNER".equals(role.getRole())) {
            long ownerCount = userOrgRoleRepository.findByOrganizationId(orgId).stream()
                    .filter(r -> "OWNER".equals(r.getRole()))
                    .count();
            if (ownerCount <= 1) {
                throw new ConflictException("Cannot remove the last owner of the organization");
            }
        }
        userOrgRoleRepository.delete(role);
    }

    // ─── Toggle User Status ─────────────────────────────────────────

    @Transactional
    @Audited(entity = "TeamMember", action = "CHANGE_STATUS")
    public void toggleUserStatus(UUID targetUserId, boolean active) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(targetUserId)) {
            throw new ConflictException(
                    "Cannot change status of the organization creator. The creator cannot be made inactive.");
        }

        if (currentUserId().equals(targetUserId)) {
            throw new BadRequestException("You cannot change the status of your own account");
        }

        String callerRole = callerRole(orgId);
        if (!Roles.satisfies(callerRole, Roles.ADMIN)) {
            throw new ForbiddenException("Only Owner and Admin have permission to toggle user status");
        }

        UserOrgRole targetOrgRole = membership(targetUserId, orgId);
        if (!Roles.outranks(callerRole, targetOrgRole.getRole())) {
            throw new ForbiddenException(
                    "You do not have permission to change status of user with equal or higher role");
        }

        // Status is per membership: deactivating someone here never locks them out of their other organizations.
        targetOrgRole.setIsActive(active);
        userOrgRoleRepository.save(targetOrgRole);

        User targetUser = userRepository
                .findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean activeElsewhere = userOrgRoleRepository.findByUserId(targetUserId).stream()
                .anyMatch(r -> !orgId.equals(r.getOrganizationId()) && r.isActiveMembership());

        if (!active && !activeElsewhere) {
            // This was their last active membership, so disable the account and its sign-in as well
            targetUser.setIsActive(false);
            setSupabaseSignIn(targetUser, false);
            userRepository.save(targetUser);
        } else if (active && !Boolean.TRUE.equals(targetUser.getIsActive())) {
            targetUser.setIsActive(true);
            setSupabaseSignIn(targetUser, true);
            userRepository.save(targetUser);
        }
    }

    /** Bans (and signs out) or un-bans the user's Supabase Auth account. Best effort: the local flag is authoritative. */
    private void setSupabaseSignIn(User targetUser, boolean enabled) {
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
        if (supabaseId == null) {
            return;
        }

        if (!enabled) {
            try {
                jdbcTemplate.update("DELETE FROM auth.sessions WHERE user_id = ?", supabaseId);
                jdbcTemplate.update("DELETE FROM auth.refresh_tokens WHERE user_id = ?", supabaseId);
                jdbcTemplate.update(
                        "UPDATE auth.users SET banned_until = '2999-12-31 23:59:59+00' WHERE id = ?", supabaseId);
                log.info("Terminated all sessions and banned Supabase user {} ({})", supabaseId, targetUser.getEmail());
            } catch (Exception e) {
                log.error("Failed to revoke Supabase sessions or ban user {}: {}", supabaseId, e.getMessage());
            }
        } else {
            try {
                jdbcTemplate.update("UPDATE auth.users SET banned_until = NULL WHERE id = ?", supabaseId);
                log.info("Lifted Supabase ban for user {} ({})", supabaseId, targetUser.getEmail());
            } catch (Exception e) {
                log.error("Failed to clear Supabase ban for user {}: {}", supabaseId, e.getMessage());
            }
        }
    }

    // ─── Private Helpers ────────────────────────────────────────────

    private UUID currentUserId() {
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal.getId();
    }

    /** The caller's effective role here (direct or inherited from the parent) — the same one @PreAuthorize saw. */
    private String callerRole(UUID orgId) {
        return tenantSecurity
                .currentRoleIn(orgId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this organization"));
    }

    private UserOrgRole membership(UUID userId, UUID orgId) {
        return userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new BadRequestException("User is not a member of this organization"));
    }

    /** Owners may grant any role; everyone else only roles below their own. */
    private void requireAssignable(String callerRole, String role) {
        if (!Roles.isValid(role)) {
            throw new BadRequestException("Role must be one of " + String.join(", ", Roles.HIERARCHY));
        }
        if (!Roles.OWNER.equals(callerRole) && !Roles.outranks(callerRole, role)) {
            throw new ForbiddenException("You can only assign roles below your own");
        }
    }

    /** Owners may manage any member (creator and last-owner rules still apply); others only members they outrank. */
    private void requireManageable(String callerRole, String targetRole) {
        if (!Roles.OWNER.equals(callerRole) && !Roles.outranks(callerRole, targetRole)) {
            throw new ForbiddenException("You can only manage members below your own role");
        }
    }

    private String generateUniqueEmail(String firstName, String lastName, String suffix) {
        String normalizedFirst = normalize(firstName);
        String normalizedLast = normalize(lastName);
        String domain = suffix + "." + emailBaseDomain;

        for (int attempt = 0; attempt < 5; attempt++) {
            int randomDigits = 10 + RANDOM.nextInt(90);
            String email = normalizedFirst + "." + normalizedLast + "." + randomDigits + "@" + domain;

            if (!userRepository.existsByEmail(email)) {
                return email;
            }
            log.debug("Email collision for {}, retrying...", email);
        }
        String fallback = normalizedFirst + "." + normalizedLast + "."
                + UUID.randomUUID().toString().substring(0, 6) + "@" + domain;
        return fallback;
    }

    private String normalize(String name) {
        return name.trim().toLowerCase().replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", ".");
    }

    private String generatePassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    public UUID resolveOrganizationCreator(Organization org) {
        if (org == null) {
            return null;
        }
        if (org.getCreatedBy() != null) {
            return org.getCreatedBy();
        }
        // Fallback for legacy organizations: the earliest OWNER in user_org_roles
        return userOrgRoleRepository.findByOrganizationId(org.getId()).stream()
                .filter(r -> "OWNER".equalsIgnoreCase(r.getRole()))
                .min(java.util.Comparator.comparing(
                        UserOrgRole::getCreatedAt, java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                .map(r -> r.getUser().getId())
                .orElseGet(() -> userOrgRoleRepository.findByOrganizationId(org.getId()).stream()
                        .min(java.util.Comparator.comparing(
                                UserOrgRole::getCreatedAt,
                                java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                        .map(r -> r.getUser().getId())
                        .orElse(null));
    }
}
