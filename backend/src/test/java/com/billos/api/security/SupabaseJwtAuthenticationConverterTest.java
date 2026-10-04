package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.billos.api.entity.User;
import com.billos.api.exception.ConflictException;
import com.billos.api.service.SupabaseUserProvisioningService;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.oauth2.jwt.Jwt;

@ExtendWith(MockitoExtension.class)
class SupabaseJwtAuthenticationConverterTest {

    @Mock
    private SupabaseUserProvisioningService provisioningService;

    @InjectMocks
    private SupabaseJwtAuthenticationConverter converter;

    private static final UUID SUPABASE_ID = UUID.randomUUID();
    private static final UUID LOCAL_USER_ID = UUID.randomUUID();

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(LOCAL_USER_ID);
        testUser.setEmail("user@example.com");
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setPhone("+91 9876543210");
        testUser.setIsActive(true);
        testUser.setSupabaseId(SUPABASE_ID);
    }

    private Jwt createJwt(String role, String sub, String email, Map<String, Object> metadata, String phone) {
        Jwt.Builder builder = Jwt.withTokenValue("mock-token")
                .header("alg", "none")
                .claim("role", role)
                .claim("sub", sub)
                .claim("email", email)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600));

        if (metadata != null) {
            builder.claim("user_metadata", metadata);
        }
        if (phone != null) {
            builder.claim("phone", phone);
        }
        return builder.build();
    }

    @Test
    @DisplayName("should convert valid JWT to authentication token")
    void shouldConvertValidJwt() {
        Jwt jwt =
                createJwt("authenticated", SUPABASE_ID.toString(), "user@example.com", Map.of("name", "John Doe"), "");

        when(provisioningService.resolveUser(any())).thenReturn(testUser);

        AbstractAuthenticationToken auth = converter.convert(jwt);

        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isInstanceOf(UserPrincipal.class);
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        assertThat(principal.getId()).isEqualTo(LOCAL_USER_ID);
        assertThat(principal.getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("should throw BadCredentialsException when role is not authenticated")
    void shouldThrowWhenRoleInvalid() {
        Jwt jwt = createJwt("anon", SUPABASE_ID.toString(), "user@example.com", null, null);

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid token role");
    }

    @Test
    @DisplayName("should throw BadCredentialsException when sub is missing or not a UUID")
    void shouldThrowWhenSubInvalid() {
        Jwt jwt = createJwt("authenticated", "not-a-uuid", "user@example.com", null, null);

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Missing or invalid 'sub' claim");
    }

    @Test
    @DisplayName("should throw BadCredentialsException when email claim is missing")
    void shouldThrowWhenEmailMissing() {
        Jwt jwt = createJwt("authenticated", SUPABASE_ID.toString(), "", null, null);

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Missing email claim");
    }

    @Test
    @DisplayName("should throw BadCredentialsException when user provisioning fails")
    void shouldThrowWhenProvisioningFails() {
        Jwt jwt = createJwt("authenticated", SUPABASE_ID.toString(), "user@example.com", null, null);

        when(provisioningService.resolveUser(any())).thenThrow(new RuntimeException("Database connection error"));

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Failed to provision local user");
    }

    @Test
    @DisplayName("should throw DisabledException when user is inactive")
    void shouldThrowWhenUserInactive() {
        testUser.setIsActive(false);
        Jwt jwt = createJwt("authenticated", SUPABASE_ID.toString(), "user@example.com", null, null);

        when(provisioningService.resolveUser(any())).thenReturn(testUser);

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(DisabledException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    @DisplayName("should reject the login with the refusal message when the account link is refused")
    void shouldRejectWhenAccountLinkRefused() {
        Jwt jwt = createJwt("authenticated", SUPABASE_ID.toString(), "user@example.com", null, null);

        when(provisioningService.resolveUser(any()))
                .thenThrow(new ConflictException("This email address is already linked to a different sign-in"));

        assertThatThrownBy(() -> converter.convert(jwt))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("This email address is already linked to a different sign-in");
    }

    @Test
    @DisplayName("should pass the email_verified flag from user_metadata to provisioning")
    void shouldPassEmailVerifiedFlag() {
        when(provisioningService.resolveUser(any())).thenReturn(testUser);

        converter.convert(createJwt(
                "authenticated", SUPABASE_ID.toString(), "user@example.com", Map.of("email_verified", true), null));
        verify(provisioningService).resolveUser(argThat(SupabaseIdentity::emailVerified));

        converter.convert(createJwt("authenticated", SUPABASE_ID.toString(), "user@example.com", null, null));
        verify(provisioningService).resolveUser(argThat(identity -> !identity.emailVerified()));
    }
}
