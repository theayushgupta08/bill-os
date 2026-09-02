package com.billos.api.security;

import com.billos.api.entity.User;
import com.billos.api.service.SupabaseUserProvisioningService;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final String AUTHENTICATED_ROLE = "authenticated";
    private final SupabaseUserProvisioningService userProvisioningService;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String role = jwt.getClaimAsString("role");
        if (!AUTHENTICATED_ROLE.equals(role)) {
            log.warn("Rejected token with role '{}' — only '{}' may authenticate", role, AUTHENTICATED_ROLE);
            return null; // Spring Security handles this as unauthenticated
        }

        UUID supabaseId;
        try {
            supabaseId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException | NullPointerException ex) {
            log.warn("Rejected token with a missing or non-UUID 'sub' claim");
            return null;
        }

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            log.warn("Rejected token for {} with no email claim", supabaseId);
            return null;
        }

        Map<String, Object> metadata = jwt.getClaimAsMap("user_metadata");
        if (metadata == null) {
            metadata = Map.of();
        }

        SupabaseIdentity identity = new SupabaseIdentity(
                supabaseId, email, firstNameFrom(metadata, email), lastNameFrom(metadata), phoneFrom(metadata, jwt));

        User user;
        try {
            user = userProvisioningService.resolveUser(identity);
        } catch (RuntimeException ex) {
            log.error("Failed to provision local user for Supabase id {}", identity.supabaseId(), ex);
            return null;
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Rejected token for deactivated user {}", user.getId());
            return null;
        }

        UserPrincipal principal = UserPrincipal.create(user);
        return new UsernamePasswordAuthenticationToken(principal, jwt, principal.getAuthorities());
    }

    private String firstNameFrom(Map<String, Object> metadata, String email) {
        String firstName = string(metadata, "first_name");
        if (firstName != null) return firstName;

        String[] fullName = splitFullName(metadata);
        if (fullName != null) return fullName[0];

        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    private String lastNameFrom(Map<String, Object> metadata) {
        String lastName = string(metadata, "last_name");
        if (lastName != null) return lastName;

        String[] fullName = splitFullName(metadata);
        return fullName != null ? fullName[1] : "";
    }

    private String phoneFrom(Map<String, Object> metadata, Jwt jwt) {
        String phone = string(metadata, "phone");
        return phone != null ? phone : jwt.getClaimAsString("phone");
    }

    private String[] splitFullName(Map<String, Object> metadata) {
        String fullName = string(metadata, "full_name");
        if (fullName == null) fullName = string(metadata, "name");
        if (fullName == null) return null;

        int space = fullName.indexOf(' ');
        return space < 0
                ? new String[] {fullName, ""}
                : new String[] {
                    fullName.substring(0, space), fullName.substring(space + 1).trim()
                };
    }

    private String string(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (!(value instanceof String s) || s.isBlank()) return null;
        return s.trim();
    }
}
