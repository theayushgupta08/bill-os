package com.billos.api.service;

import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.SupabaseIdentity;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Maps a verified Supabase Auth identity onto a billOS {@link User} row, creating it on first sight
 * (just-in-time provisioning).
 *
 * <p>Supabase owns credentials and email verification; billOS owns the profile row that
 * organizations, roles, and audit records point at.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseUserProvisioningService {

    private final UserRepository userRepository;

    /**
     * Resolves the local user for a Supabase identity, provisioning or back-filling as needed.
     *
     * <p>Runs in its own transaction because the caller is a servlet filter, which has no
     * transactional context of its own.
     *
     * @return the persisted local user
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public User resolveUser(SupabaseIdentity identity) {
        Optional<User> bySupabaseId = userRepository.findBySupabaseId(identity.supabaseId());
        if (bySupabaseId.isPresent()) {
            return syncProfile(bySupabaseId.get(), identity);
        }

        // A row may already exist from before Supabase Auth, or from an invitation. Link it.
        Optional<User> byEmail = userRepository.findByEmail(identity.email());
        if (byEmail.isPresent()) {
            log.info("Linking existing user {} to Supabase id {}", byEmail.get().getId(), identity.supabaseId());
            return syncProfile(byEmail.get(), identity);
        }

        return createUser(identity);
    }

    private User createUser(SupabaseIdentity identity) {
        User user = new User();
        user.setSupabaseId(identity.supabaseId());
        user.setEmail(identity.email());
        user.setFirstName(identity.firstName());
        user.setLastName(identity.lastName());
        user.setPhone(identity.phone() != null ? identity.phone() : "+91 0000000000");
        user.setIsActive(true);
        // Supabase will not mint an access token until the address is confirmed (when confirmation
        // is enabled), so a token in hand means the address is good.
        user.setIsEmailVerified(true);

        try {
            User saved = userRepository.save(user);
            log.info("Provisioned new user {} for Supabase id {}", saved.getId(), identity.supabaseId());
            return saved;
        } catch (DataIntegrityViolationException ex) {
            // Two concurrent first requests from the same new user raced us to the insert.
            // The unique constraint on supabase_id / email means exactly one won; use its row.
            log.debug("Provisioning race for Supabase id {}, re-reading", identity.supabaseId());
            return userRepository
                    .findBySupabaseId(identity.supabaseId())
                    .or(() -> userRepository.findByEmail(identity.email()))
                    .orElseThrow(() -> ex);
        }
    }

    /**
     * Keeps the local row in step with Supabase, which is the source of truth for email and
     * profile metadata.
     *
     * <p>Names are only back-filled when the local value is missing or is the email-prefix
     * placeholder an earlier provisioning run may have written — a name edited inside billOS is
     * never clobbered by stale token metadata.
     */
    private User syncProfile(User user, SupabaseIdentity identity) {
        boolean changed = false;

        // Also covers the link path: a row matched by email has no supabase_id yet.
        if (!Objects.equals(user.getSupabaseId(), identity.supabaseId())) {
            user.setSupabaseId(identity.supabaseId());
            changed = true;
        }
        if (!Objects.equals(user.getEmail(), identity.email())) {
            user.setEmail(identity.email());
            changed = true;
        }
        if (isPlaceholderName(user.getFirstName(), user.getEmail())) {
            user.setFirstName(identity.firstName());
            changed = true;
        }
        if (isBlank(user.getLastName()) && !isBlank(identity.lastName())) {
            user.setLastName(identity.lastName());
            changed = true;
        }
        if (isBlank(user.getPhone()) && !isBlank(identity.phone())) {
            user.setPhone(identity.phone());
            changed = true;
        }

        return changed ? userRepository.save(user) : user;
    }

    private boolean isPlaceholderName(String firstName, String email) {
        if (isBlank(firstName)) {
            return true;
        }
        if (email == null) {
            return false;
        }
        int at = email.indexOf('@');
        return at > 0 && firstName.equals(email.substring(0, at));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
