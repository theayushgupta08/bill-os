package com.billos.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Verifies Supabase Auth (GoTrue) access tokens.
 *
 * <p>billOS does not issue tokens — Supabase does. This class only validates the HS256 signature
 * and extracts claims.
 *
 * <p><b>Secret encoding:</b> GoTrue signs with the raw UTF-8 bytes of the project's JWT secret, so
 * the secret is used verbatim and is <em>not</em> Base64-decoded, even when it happens to look like
 * Base64.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    /** GoTrue sets this for end-user tokens. The anon/service API keys use other roles. */
    private static final String AUTHENTICATED_ROLE = "authenticated";

    /** HS256 requires a key of at least 256 bits. */
    private static final int MIN_SECRET_BYTES = 32;

    @Value("${app.security.supabase.jwt-secret:}")
    private String jwtSecret;

    private SecretKey signingKey;

    @PostConstruct
    void initSigningKey() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("SUPABASE_JWT_SECRET is not configured. Set it in backend/.env "
                    + "(Supabase dashboard → Project Settings → API → JWT Secret). "
                    + "Without it every request would be rejected.");
        }
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("SUPABASE_JWT_SECRET must be at least " + MIN_SECRET_BYTES
                    + " bytes for HS256, but was " + secretBytes.length + ".");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    }

    /**
     * Parses and verifies the token.
     *
     * @throws JwtException if the signature, format, or expiry is invalid
     */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Verifies the token and returns the identity it asserts, or {@code null} if the token is
     * invalid, expired, or is not an end-user token (e.g. the anon or service_role API key, which
     * are signed with the same secret but must never authenticate a user).
     */
    public SupabaseIdentity toIdentity(String token) {
        Claims claims;
        try {
            claims = getClaims(token);
        } catch (ExpiredJwtException ex) {
            log.debug("Rejected expired Supabase token: {}", ex.getMessage());
            return null;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Rejected invalid Supabase token: {}", ex.getMessage());
            return null;
        }

        String role = claims.get("role", String.class);
        if (!AUTHENTICATED_ROLE.equals(role)) {
            log.warn("Rejected Supabase token with role '{}' — only '{}' may authenticate", role, AUTHENTICATED_ROLE);
            return null;
        }

        UUID supabaseId;
        try {
            supabaseId = UUID.fromString(claims.getSubject());
        } catch (IllegalArgumentException | NullPointerException ex) {
            log.warn("Rejected Supabase token with a missing or non-UUID 'sub' claim");
            return null;
        }

        String email = claims.get("email", String.class);
        if (email == null || email.isBlank()) {
            log.warn("Rejected Supabase token for {} with no email claim", supabaseId);
            return null;
        }

        Map<String, Object> metadata = userMetadata(claims);
        return new SupabaseIdentity(
                supabaseId, email, firstNameFrom(metadata, email), lastNameFrom(metadata), phoneFrom(metadata, claims));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> userMetadata(Claims claims) {
        Object raw = claims.get("user_metadata");
        return raw instanceof Map ? (Map<String, Object>) raw : Map.of();
    }

    /**
     * Prefers the {@code first_name} written by our own sign-up form, then the {@code full_name} /
     * {@code name} that OAuth providers supply, and finally the email local-part.
     */
    private String firstNameFrom(Map<String, Object> metadata, String email) {
        String firstName = string(metadata, "first_name");
        if (firstName != null) {
            return firstName;
        }
        String[] fullName = splitFullName(metadata);
        if (fullName != null) {
            return fullName[0];
        }
        int at = email.indexOf('@');
        return at > 0 ? email.substring(0, at) : email;
    }

    /** Never null — the {@code users.last_name} column is NOT NULL. */
    private String lastNameFrom(Map<String, Object> metadata) {
        String lastName = string(metadata, "last_name");
        if (lastName != null) {
            return lastName;
        }
        String[] fullName = splitFullName(metadata);
        return fullName != null ? fullName[1] : "";
    }

    private String phoneFrom(Map<String, Object> metadata, Claims claims) {
        String phone = string(metadata, "phone");
        return phone != null ? phone : string(claims, "phone");
    }

    /** Splits "Ada Lovelace" into {"Ada", "Lovelace"}; returns null when no full name is present. */
    private String[] splitFullName(Map<String, Object> metadata) {
        String fullName = string(metadata, "full_name");
        if (fullName == null) {
            fullName = string(metadata, "name");
        }
        if (fullName == null) {
            return null;
        }
        int space = fullName.indexOf(' ');
        return space < 0
                ? new String[] {fullName, ""}
                : new String[] {
                    fullName.substring(0, space), fullName.substring(space + 1).trim()
                };
    }

    /** Reads a non-blank string, treating blank values as absent so fallbacks kick in. */
    private String string(Map<String, Object> source, String key) {
        Object value = source.get(key);
        if (!(value instanceof String s) || s.isBlank()) {
            return null;
        }
        return s.trim();
    }
}
