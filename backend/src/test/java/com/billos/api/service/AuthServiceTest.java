package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private Authentication mockAuthentication;

    @BeforeEach
    void setUp() {
        mockAuthentication = mock(Authentication.class);
    }

    @Test
    @DisplayName("login - should authenticate and return JWT token")
    void login_shouldAuthenticateAndReturnToken() {
        // Arrange
        String email = "test@example.com";
        String password = "password123";
        String expectedToken = "jwt.token.here";

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuthentication);
        when(jwtTokenProvider.generateToken(mockAuthentication)).thenReturn(expectedToken);

        // Act
        String token = authService.login(email, password);

        // Assert
        assertThat(token).isEqualTo(expectedToken);
        verify(authenticationManager)
                .authenticate(argThat(auth -> auth.getPrincipal().equals(email)
                        && auth.getCredentials().equals(password)));
        verify(jwtTokenProvider).generateToken(mockAuthentication);
    }

    @Test
    @DisplayName("register - should create user and return JWT token")
    void register_shouldCreateUserAndReturnToken() {
        // Arrange
        String firstName = "John";
        String lastName = "Doe";
        String email = "john@example.com";
        String password = "password123";
        String phone = "+919876543210";
        String encodedPassword = "encoded_password";
        String expectedToken = "jwt.token.here";

        when(userRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(password)).thenReturn(encodedPassword);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuthentication);
        when(jwtTokenProvider.generateToken(mockAuthentication)).thenReturn(expectedToken);

        // Act
        String token = authService.register(firstName, lastName, email, password, phone);

        // Assert
        assertThat(token).isEqualTo(expectedToken);
        verify(userRepository).save(argThat(user -> {
            assertThat(user.getFirstName()).isEqualTo(firstName);
            assertThat(user.getLastName()).isEqualTo(lastName);
            assertThat(user.getEmail()).isEqualTo(email);
            assertThat(user.getPasswordHash()).isEqualTo(encodedPassword);
            assertThat(user.getPhone()).isEqualTo(phone);
            return true;
        }));
    }

    @Test
    @DisplayName("register - should throw when email already exists")
    void register_shouldThrowWhenEmailExists() {
        // Arrange
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> authService.register("Jane", "Doe", "taken@example.com", "pass", null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email is already exists");

        verify(userRepository, never()).save(any(User.class));
    }
}
