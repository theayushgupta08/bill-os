package com.billos.api.service;

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

        List<UserOrgRole> roles = userOrgRoleRepository.findAll();
        for (UserOrgRole role : roles) {
            if (role.getOrganizationId().equals(orgId)) {
                User user = userRepository.findById(role.getUser().getId()).orElse(null);
                if (user != null) {
                    boolean isCreator = creatorId != null && creatorId.equals(user.getId());
                    java.time.OffsetDateTime lastActive =
                            user.getUpdatedAt() != null ? user.getUpdatedAt() : user.getCreatedAt();
                    if (user.getSupabaseId() != null && jdbcTemplate != null) {
                        try {
                            List<java.time.OffsetDateTime> logins = jdbcTemplate.query(
                                    "SELECT last_sign_in_at FROM auth.users WHERE id = ? AND last_sign_in_at IS NOT NULL",
                                    (rs, rowNum) -> rs.getObject("last_sign_in_at", java.time.OffsetDateTime.class),
                                    user.getSupabaseId());
                            if (!logins.isEmpty() && logins.get(0) != null) {
                                lastActive = logins.get(0);
                            }
                        } catch (Exception ignored) {
                            // Supabase auth schema may not exist in test environments
                        }
                    }
                    team.add(TeamMemberDto.builder()
                            .userId(user.getId())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .role(role.getRole())
                            .status(Boolean.TRUE.equals(user.getIsActive()) ? "ACTIVE" : "INACTIVE")
                            .lastActiveAt(lastActive)
                            .isCreator(isCreator)
                            .build());
                }
            }
        }

        return team;
    }

    // ─── Create Member (Owner-Created Account) ──────────────────────

    @Transactional
    public CreateMemberResponse createMember(CreateMemberRequest request) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        // Resolve the email suffix — use primary org's suffix (branches inherit)
        Organization org = organizationRepository
                .findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        String suffix = org.getEmailSuffix();
        if (suffix == null && org.getParentOrganizationId() != null) {
            Organization parent = organizationRepository
                    .findById(org.getParentOrganizationId())
                    .orElseThrow(() -> new RuntimeException("Parent organization not found"));
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
    public String resetMemberPassword(UUID targetUserId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        UserOrgRole callerRole = userOrgRoleRepository
                .findByUserIdAndOrganizationId(principal.getId(), orgId)
                .orElseThrow(() -> new RuntimeException("Caller is not a member of this organization"));
        if (!"OWNER".equals(callerRole.getRole()) && !"ADMIN".equals(callerRole.getRole())) {
            throw new RuntimeException("Only OWNER or ADMIN can reset passwords");
        }

        if (principal.getId().equals(targetUserId)) {
            throw new RuntimeException("Use the change-password flow to change your own password");
        }

        User target = userRepository.findById(targetUserId).orElseThrow(() -> new RuntimeException("User not found"));
        if (target.getSupabaseId() == null) {
            throw new RuntimeException("User does not have a Supabase auth account");
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
    public void updateUserRole(UUID userId, String newRole) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(userId)) {
            throw new RuntimeException(
                    "Cannot change role of the organization creator. The creator must remain OWNER.");
        }

        UserOrgRole role = userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this organization"));

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

    // ─── Remove User ────────────────────────────────────────────────

    @Transactional
    public void removeUser(UUID userId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(userId)) {
            throw new RuntimeException("Cannot remove the organization creator from the organization.");
        }

        UserOrgRole role = userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this organization"));

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

    // ─── Toggle User Status ─────────────────────────────────────────

    @Transactional
    public void toggleUserStatus(UUID targetUserId, boolean active) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Organization org = organizationRepository.findById(orgId).orElse(null);
        UUID creatorId = resolveOrganizationCreator(org);
        if (creatorId != null && creatorId.equals(targetUserId)) {
            throw new RuntimeException(
                    "Cannot change status of the organization creator. The creator cannot be made inactive.");
        }

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

        String callerRoleStr = callerOrgRole.getRole();
        String targetRole = targetOrgRole.getRole();

        int callerLevel = hierarchy.indexOf(callerRoleStr);
        int targetLevel = hierarchy.indexOf(targetRole);

        if (callerLevel == -1 || targetLevel == -1) {
            throw new RuntimeException("Invalid role found");
        }

        if (callerId.equals(targetUserId)) {
            throw new RuntimeException("You cannot change the status of your own account");
        }

        if (!"OWNER".equals(callerRoleStr) && !"ADMIN".equals(callerRoleStr)) {
            throw new RuntimeException("Only Owner and Admin have permission to toggle user status");
        }

        if (callerLevel >= targetLevel) {
            throw new RuntimeException("You do not have permission to change status of user with equal or higher role");
        }

        User targetUser =
                userRepository.findById(targetUserId).orElseThrow(() -> new RuntimeException("User not found"));

        targetUser.setIsActive(active);

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
                    jdbcTemplate.update("DELETE FROM auth.sessions WHERE user_id = ?", supabaseId);
                    jdbcTemplate.update("DELETE FROM auth.refresh_tokens WHERE user_id = ?", supabaseId);
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
                    jdbcTemplate.update("UPDATE auth.users SET banned_until = NULL WHERE id = ?", supabaseId);
                    log.info("Lifted Supabase ban for user {} ({})", supabaseId, targetUser.getEmail());
                } catch (Exception e) {
                    log.error("Failed to clear Supabase ban for user {}: {}", supabaseId, e.getMessage());
                }
            }
        }

        userRepository.save(targetUser);
    }

    // ─── Private Helpers ────────────────────────────────────────────

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
