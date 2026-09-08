package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.billos.api.dto.UserProfileDto;
import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private static final UUID USER_ID = UUID.randomUUID();
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(USER_ID);
        testUser.setEmail("test@example.com");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setPhone(null);
        testUser.setIsActive(true);
        testUser.setIsEmailVerified(true);

        UserPrincipal principal = UserPrincipal.create(testUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("should get current user profile")
    void shouldGetCurrentUserProfile() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));

        UserProfileDto profile = userService.getCurrentUserProfile();

        assertThat(profile).isNotNull();
        assertThat(profile.getId()).isEqualTo(USER_ID);
        assertThat(profile.getEmail()).isEqualTo("test@example.com");
        assertThat(profile.getPhone()).isNull();
    }

    @Test
    @DisplayName("should update phone for current user")
    void shouldUpdatePhone() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileDto updated = userService.updatePhone("+91 9876543210");

        assertThat(updated.getPhone()).isEqualTo("+91 9876543210");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("should update personal profile for current user")
    void shouldUpdateProfile() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        com.billos.api.dto.UpdateProfileRequest request = com.billos.api.dto.UpdateProfileRequest.builder()
                .firstName("Ayush")
                .lastName("Gupta")
                .phone("+91 9876543210")
                .build();

        UserProfileDto updated = userService.updateProfile(request);

        assertThat(updated.getFirstName()).isEqualTo("Ayush");
        assertThat(updated.getLastName()).isEqualTo("Gupta");
        assertThat(updated.getPhone()).isEqualTo("+91 9876543210");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("should throw when no authentication is present")
    void shouldThrowWhenUnauthenticated() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> userService.getCurrentUserProfile())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("No authenticated user found");
    }
}
