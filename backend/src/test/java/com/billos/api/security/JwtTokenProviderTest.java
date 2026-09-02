package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

@SuppressWarnings("null")
class JwtTokenProviderTest {

    /** Shape and length of a real Supabase legacy JWT secret (40 chars, used as raw UTF-8). */
    private static final String SECRET = "super-secret-supabase-jwt-signing-key-01";

    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = newProvider(SECRET);
    }

    private JwtTokenProvider newProvider(String secret) {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", secret);
        provider.initSigningKey();
        return provider;
    }

    // --- Startup validation -------------------------------------------------

    @Test
    @DisplayName("initSigningKey - should fail fast when the secret is missing")
    void shouldFailFast_whenSecretMissing() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "");

        assertThatThrownBy(provider::initSigningKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUPABASE_JWT_SECRET is not configured");
    }

    @Test
    @DisplayName("initSigningKey - should fail fast when the secret is too short for HS256")
    void shouldFailFast_whenSecretTooShort() {
        JwtTokenProvider provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", "too-short");

        assertThatThrownBy(provider::initSigningKey)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    @DisplayName("initSigningKey - should treat the secret as raw UTF-8, not Base64")
    void shouldTreatSecretAsRawUtf8() {
        // A Base64-looking secret must still verify against a token signed with its literal bytes.
        String base64Looking = "XFz99nrtQmVsbG9Xb3JsZFNlY3JldEtleUZvcjI1Ng==";
        SecretKey rawBytesKey = Keys.hmacShaKeyFor(base64Looking.getBytes(StandardCharsets.UTF_8));
        String token = tokenBuilder().signWith(rawBytesKey).compact();

        assertThat(newProvider(base64Looking).toIdentity(token)).isNotNull();
    }

    // --- Rejection paths ----------------------------------------------------

    @Test
    @DisplayName("toIdentity - should return null for a token signed with a different secret")
    void shouldReturnNull_whenSignatureInvalid() {
        SecretKey otherKey =
                Keys.hmacShaKeyFor("a-completely-different-signing-key-here!!".getBytes(StandardCharsets.UTF_8));
        String token = tokenBuilder().signWith(otherKey).compact();

        assertThat(jwtTokenProvider.toIdentity(token)).isNull();
    }

    @Test
    @DisplayName("toIdentity - should return null for an expired token")
    void shouldReturnNull_whenExpired() {
        String token = tokenBuilder()
                .issuedAt(Date.from(Instant.now().minus(2, ChronoUnit.HOURS)))
                .expiration(Date.from(Instant.now().minus(1, ChronoUnit.HOURS)))
                .signWith(KEY)
                .compact();

        assertThat(jwtTokenProvider.toIdentity(token)).isNull();
    }

    @Test
    @DisplayName("toIdentity - should return null for a malformed token")
    void shouldReturnNull_whenMalformed() {
        assertThat(jwtTokenProvider.toIdentity("not.a.valid.jwt")).isNull();
        assertThat(jwtTokenProvider.toIdentity("")).isNull();
    }

    @Test
    @DisplayName("toIdentity - should reject the anon API key, which is signed with the same secret")
    void shouldReturnNull_whenRoleIsNotAuthenticated() {
        // The Supabase anon key is a valid JWT under the project secret; it must never log anyone in.
        String anonKey = Jwts.builder()
                .claim("role", "anon")
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(KEY)
                .compact();

        assertThat(jwtTokenProvider.toIdentity(anonKey)).isNull();
    }

    @Test
    @DisplayName("toIdentity - should reject the service_role key")
    void shouldReturnNull_whenServiceRoleKey() {
        String serviceKey = Jwts.builder()
                .claim("role", "service_role")
                .subject(UUID.randomUUID().toString())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(KEY)
                .compact();

        assertThat(jwtTokenProvider.toIdentity(serviceKey)).isNull();
    }

    @Test
    @DisplayName("toIdentity - should return null when 'sub' is not a UUID")
    void shouldReturnNull_whenSubjectNotUuid() {
        String token = tokenBuilder().subject("not-a-uuid").signWith(KEY).compact();

        assertThat(jwtTokenProvider.toIdentity(token)).isNull();
    }

    @Test
    @DisplayName("toIdentity - should return null when the email claim is absent")
    void shouldReturnNull_whenEmailMissing() {
        String token = Jwts.builder()
                .claim("role", "authenticated")
                .subject(UUID.randomUUID().toString())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(KEY)
                .compact();

        assertThat(jwtTokenProvider.toIdentity(token)).isNull();
    }

    // --- Identity extraction ------------------------------------------------

    @Test
    @DisplayName("toIdentity - should extract names from user_metadata written at sign-up")
    void shouldExtractNamesFromUserMetadata() {
        UUID supabaseId = UUID.randomUUID();
        String token = tokenBuilder()
                .subject(supabaseId.toString())
                .claim("email", "ada@example.com")
                .claim(
                        "user_metadata",
                        metadata("first_name", "Ada", "last_name", "Lovelace", "phone", "+919876543210"))
                .signWith(KEY)
                .compact();

        SupabaseIdentity identity = jwtTokenProvider.toIdentity(token);

        assertThat(identity).isNotNull();
        assertThat(identity.supabaseId()).isEqualTo(supabaseId);
        assertThat(identity.email()).isEqualTo("ada@example.com");
        assertThat(identity.firstName()).isEqualTo("Ada");
        assertThat(identity.lastName()).isEqualTo("Lovelace");
        assertThat(identity.phone()).isEqualTo("+919876543210");
    }

    @Test
    @DisplayName("toIdentity - should split full_name supplied by OAuth providers")
    void shouldSplitFullName() {
        String token = tokenBuilder()
                .claim("user_metadata", metadata("full_name", "Grace Brewster Hopper"))
                .signWith(KEY)
                .compact();

        SupabaseIdentity identity = jwtTokenProvider.toIdentity(token);

        assertThat(identity.firstName()).isEqualTo("Grace");
        assertThat(identity.lastName()).isEqualTo("Brewster Hopper");
    }

    @Test
    @DisplayName("toIdentity - should fall back to the email local-part when no name metadata exists")
    void shouldFallBackToEmailPrefix() {
        String token =
                tokenBuilder().claim("email", "solo@example.com").signWith(KEY).compact();

        SupabaseIdentity identity = jwtTokenProvider.toIdentity(token);

        assertThat(identity.firstName()).isEqualTo("solo");
        assertThat(identity.lastName()).isEmpty();
        assertThat(identity.phone()).isNull();
    }

    @Test
    @DisplayName("toIdentity - should ignore blank metadata values so fallbacks apply")
    void shouldIgnoreBlankMetadata() {
        String token = tokenBuilder()
                .claim("email", "blank@example.com")
                .claim("user_metadata", metadata("first_name", "   ", "last_name", ""))
                .signWith(KEY)
                .compact();

        SupabaseIdentity identity = jwtTokenProvider.toIdentity(token);

        assertThat(identity.firstName()).isEqualTo("blank");
        assertThat(identity.lastName()).isEmpty();
    }

    // --- Helpers ------------------------------------------------------------

    /** A minimal but valid Supabase end-user token; callers override claims as needed. */
    private io.jsonwebtoken.JwtBuilder tokenBuilder() {
        return Jwts.builder()
                .claim("role", "authenticated")
                .claim("email", "user@example.com")
                .subject(UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)));
    }

    private Map<String, Object> metadata(String... keyValuePairs) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValuePairs.length; i += 2) {
            map.put(keyValuePairs[i], keyValuePairs[i + 1]);
        }
        return map;
    }
}
