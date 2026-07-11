package com.billos.api.security;

import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("loadUserByUsername - should return UserPrincipal when user exists")
    void loadUserByUsername_shouldReturnUserPrincipal() {
        // Arrange
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setEmail("test@example.com");
        user.setPasswordHash("hashed_password");
        user.setFirstName("Test");
        user.setLastName("User");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        // Act
        UserDetails result = customUserDetailsService.loadUserByUsername("test@example.com");

        // Assert
        assertThat(result).isInstanceOf(UserPrincipal.class);
        assertThat(result.getUsername()).isEqualTo("test@example.com");
        assertThat(result.getPassword()).isEqualTo("hashed_password");

        UserPrincipal principal = (UserPrincipal) result;
        assertThat(principal.getId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("loadUserByUsername - should throw when user not found")
    void loadUserByUsername_shouldThrowWhenUserNotFound() {
        // Arrange
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("User not found with email: missing@example.com");
    }
}
