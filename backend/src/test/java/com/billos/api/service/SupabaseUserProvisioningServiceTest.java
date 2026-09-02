package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.SupabaseIdentity;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SupabaseUserProvisioningServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SupabaseUserProvisioningService provisioningService;

    private static final UUID SUPABASE_ID = UUID.randomUUID();

    private SupabaseIdentity identity() {
        return new SupabaseIdentity(SUPABASE_ID, "ada@example.com", "Ada", "Lovelace", "+919876543210");
    }

    @Test
    @DisplayName("should create a user with metadata names when none exists")
    void shouldCreateUser_whenNoneExists() {
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = provisioningService.resolveUser(identity());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        // Regression: names used to be derived from the email prefix, silently discarding what the
        // user typed at sign-up.
        assertThat(saved.getFirstName()).isEqualTo("Ada");
        assertThat(saved.getLastName()).isEqualTo("Lovelace");
        assertThat(saved.getPhone()).isEqualTo("+919876543210");
        assertThat(saved.getSupabaseId()).isEqualTo(SUPABASE_ID);
        assertThat(saved.getEmail()).isEqualTo("ada@example.com");
        assertThat(saved.getIsActive()).isTrue();
        assertThat(saved.getIsEmailVerified()).isTrue();
        assertThat(result).isSameAs(saved);
    }

    @Test
    @DisplayName("should return the existing user unchanged when already linked and in sync")
    void shouldReturnExistingUser_whenAlreadyLinked() {
        User existing = user("ada@example.com", "Ada", "Lovelace", "+919876543210");
        existing.setSupabaseId(SUPABASE_ID);
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.of(existing));

        User result = provisioningService.resolveUser(identity());

        assertThat(result).isSameAs(existing);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should link a pre-Supabase row found by email")
    void shouldLinkExistingUser_whenFoundByEmail() {
        User legacy = user("ada@example.com", "Ada", "Lovelace", "+919876543210");
        legacy.setSupabaseId(null);
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.of(legacy));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = provisioningService.resolveUser(identity());

        assertThat(result.getSupabaseId()).isEqualTo(SUPABASE_ID);
        assertThat(result.getId()).isEqualTo(legacy.getId());
    }

    @Test
    @DisplayName("should back-fill an email-prefix placeholder name from metadata")
    void shouldBackfillPlaceholderName() {
        // Left behind by the earlier provisioning implementation.
        User placeholder = user("ada@example.com", "ada", "", null);
        placeholder.setSupabaseId(SUPABASE_ID);
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.of(placeholder));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = provisioningService.resolveUser(identity());

        assertThat(result.getFirstName()).isEqualTo("Ada");
        assertThat(result.getLastName()).isEqualTo("Lovelace");
        assertThat(result.getPhone()).isEqualTo("+919876543210");
    }

    @Test
    @DisplayName("should not overwrite a name edited inside billOS")
    void shouldNotOverwriteCuratedName() {
        User curated = user("ada@example.com", "Augusta", "King-Noel", "+911111111111");
        curated.setSupabaseId(SUPABASE_ID);
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.of(curated));

        User result = provisioningService.resolveUser(identity());

        assertThat(result.getFirstName()).isEqualTo("Augusta");
        assertThat(result.getLastName()).isEqualTo("King-Noel");
        assertThat(result.getPhone()).isEqualTo("+911111111111");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("should adopt a changed email from Supabase")
    void shouldSyncChangedEmail() {
        User existing = user("old@example.com", "Ada", "Lovelace", "+919876543210");
        existing.setSupabaseId(SUPABASE_ID);
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = provisioningService.resolveUser(identity());

        assertThat(result.getEmail()).isEqualTo("ada@example.com");
    }

    @Test
    @DisplayName("should recover the winning row when two first requests race to insert")
    void shouldRecoverFromProvisioningRace() {
        User winner = user("ada@example.com", "Ada", "Lovelace", "+919876543210");
        winner.setSupabaseId(SUPABASE_ID);

        when(userRepository.findBySupabaseId(SUPABASE_ID))
                .thenReturn(Optional.empty()) // initial lookup
                .thenReturn(Optional.of(winner)); // re-read after the constraint violation
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate key"));

        User result = provisioningService.resolveUser(identity());

        assertThat(result).isSameAs(winner);
    }

    @Test
    @DisplayName("should rethrow when a constraint violation is not a provisioning race")
    void shouldRethrow_whenViolationIsNotARace() {
        when(userRepository.findBySupabaseId(SUPABASE_ID)).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ada@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenThrow(new DataIntegrityViolationException("null in first_name"));

        assertThatThrownBy(() -> provisioningService.resolveUser(identity()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private User user(String email, String firstName, String lastName, String phone) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPhone(phone);
        user.setIsActive(true);
        return user;
    }
}
