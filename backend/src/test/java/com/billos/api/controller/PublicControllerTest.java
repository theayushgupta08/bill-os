package com.billos.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserRepository;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class PublicControllerTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtDecoder jwtDecoder;

    @InjectMocks
    private PublicController publicController;

    private Jwt jwtWithEmail(String email) {
        return Jwt.withTokenValue("t")
                .header("alg", "ES256")
                .claim("email", email)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(60))
                .build();
    }

    @Test
    void shouldCheckOnlyTheTokensOwnEmail() {
        when(jwtDecoder.decode("good-token")).thenReturn(jwtWithEmail(" Owner@Example.com "));
        when(userRepository.existsByEmail("owner@example.com")).thenReturn(true);

        ResponseEntity<Map<String, Object>> res =
                publicController.checkUserExists(Map.of("accessToken", "good-token", "email", "victim@x.com"));

        assertThat(res.getStatusCode().value()).isEqualTo(200);
        assertThat(res.getBody()).containsEntry("exists", true);
        verify(userRepository, never()).existsByEmail("victim@x.com");
    }

    @Test
    void shouldReturn401_whenTokenIsInvalid() {
        when(jwtDecoder.decode("forged")).thenThrow(new BadJwtException("bad signature"));

        ResponseEntity<Map<String, Object>> res = publicController.checkUserExists(Map.of("accessToken", "forged"));

        assertThat(res.getStatusCode().value()).isEqualTo(401);
        verifyNoInteractions(userRepository);
    }

    @Test
    void shouldReturn400_whenTokenMissing() {
        ResponseEntity<Map<String, Object>> res = publicController.checkUserExists(Map.of());

        assertThat(res.getStatusCode().value()).isEqualTo(400);
        verifyNoInteractions(jwtDecoder, userRepository);
    }
}
