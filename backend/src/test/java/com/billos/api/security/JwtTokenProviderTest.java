package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Collections;
import java.util.Date;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@SuppressWarnings("null")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    // A valid base64-encoded 256-bit key for testing
    private static final String TEST_SECRET = "dGhpc2lzYXZlcnlsb25nc2VjcmV0a2V5Zm9ydGVzdGluZ3B1cnBvc2VzMTIzNA==";
    private static final long TEST_EXPIRATION = 3600000L; // 1 hour

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationDate", TEST_EXPIRATION);
    }

    @Test
    @DisplayName("generateToken - should produce a valid JWT")
    void generateToken_shouldProduceValidJwt() {
        // Arrange
        Authentication auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, Collections.emptyList());

        // Act
        String token = jwtTokenProvider.generateToken(auth);

        // Assert
        assertThat(token).isNotNull().isNotEmpty();
        // Token should have three parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("getUsername - should extract subject from token")
    void getUsername_shouldExtractSubject() {
        // Arrange
        Authentication auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, Collections.emptyList());
        String token = jwtTokenProvider.generateToken(auth);

        // Act
        String username = jwtTokenProvider.getUsername(token);

        // Assert
        assertThat(username).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("validateToken - should return true for valid token")
    void validateToken_shouldReturnTrueForValid() {
        // Arrange
        Authentication auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, Collections.emptyList());
        String token = jwtTokenProvider.generateToken(auth);

        // Act & Assert
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateToken - should return false for expired token")
    void validateToken_shouldReturnFalseForExpired() {
        // Arrange - create an already-expired token
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(TEST_SECRET));
        String expiredToken = Jwts.builder()
                .subject("user@example.com")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000)) // 2 hours ago
                .expiration(new Date(System.currentTimeMillis() - 3600000)) // 1 hour ago
                .signWith(key)
                .compact();

        // Act & Assert
        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }

    @Test
    @DisplayName("validateToken - should return false for malformed token")
    void validateToken_shouldReturnFalseForMalformed() {
        assertThat(jwtTokenProvider.validateToken("not.a.valid.jwt")).isFalse();
    }

    @Test
    @DisplayName("validateToken - should return false for empty token")
    void validateToken_shouldReturnFalseForEmpty() {
        assertThat(jwtTokenProvider.validateToken("")).isFalse();
    }
}
