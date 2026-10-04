package com.billos.api.service;

import com.billos.api.entity.User;
import com.billos.api.exception.ConflictException;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.SupabaseIdentity;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Pattern;
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

    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+\\d{1,4} ?\\d{4,14}$");
    private static final Pattern TEN_DIGITS_PATTERN = Pattern.compile("^\\d{10}$");

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

        // A row may already exist from before Supabase Auth. Linking hands that user (and every organization they
        // belong to) to whoever holds this login, so it is allowed only for a row that has never been linked, and
        // only once Supabase has verified the email address.
        Optional<User> byEmail = userRepository.findByEmail(identity.email());
        if (byEmail.isPresent()) {
            return linkByEmail(byEmail.get(), identity);
        }

        return createUser(identity);
    }

    private User linkByEmail(User existing, SupabaseIdentity identity) {
        if (existing.getSupabaseId() != null) {
            log.warn(
                    "Refused Supabase id {}: email {} already belongs to user {} with a different login",
                    identity.supabaseId(),
                    identity.email(),
                    existing.getId());
            throw new ConflictException("This email address is already linked to a different sign-in");
        }
        if (!identity.emailVerified()) {
            log.warn("Refused to link unverified email {} to existing user {}", identity.email(), existing.getId());
            throw new ConflictException("Verify your email address before signing in to this account");
        }
        log.info("Linking existing user {} to Supabase id {}", existing.getId(), identity.supabaseId());
        return syncProfile(existing, identity);
    }

    private User createUser(SupabaseIdentity identity) {
        User user = new User();
        user.setSupabaseId(identity.supabaseId());
        user.setEmail(identity.email());

        String firstName = identity.firstName();
        if (isBlank(firstName)) {
            firstName = "User";
        }
        user.setFirstName(firstName);

        String lastName = identity.lastName();
        if (lastName == null) {
            lastName = "";
        }
        user.setLastName(lastName);

        user.setPhone(sanitizePhone(identity.phone()));
        user.setIsActive(true);
        user.setIsEmailVerified(true);

        try {
            User saved = userRepository.save(user);
            log.info("Provisioned new user {} for Supabase id {}", saved.getId(), identity.supabaseId());
            return saved;
        } catch (DataIntegrityViolationException ex) {
            log.debug("Provisioning race for Supabase id {}, re-reading", identity.supabaseId());
            // Only a concurrent request for this same login is a benign race; an email clash with another user is not
            return userRepository.findBySupabaseId(identity.supabaseId()).orElseThrow(() -> ex);
        }
    }

    private User syncProfile(User user, SupabaseIdentity identity) {
        boolean changed = false;

        // Set once when linking; never re-pointed to a different login
        if (user.getSupabaseId() == null) {
            user.setSupabaseId(identity.supabaseId());
            changed = true;
        }
        if (!Objects.equals(user.getEmail(), identity.email())) {
            user.setEmail(identity.email());
            changed = true;
        }
        if (isPlaceholderName(user.getFirstName(), user.getEmail())) {
            if (!isBlank(identity.firstName())) {
                user.setFirstName(identity.firstName());
                changed = true;
            }
        }
        if (user.getLastName() == null) {
            user.setLastName("");
            changed = true;
        } else if (isBlank(user.getLastName()) && !isBlank(identity.lastName())) {
            user.setLastName(identity.lastName());
            changed = true;
        }

        if (isBlank(user.getPhone()) && !isBlank(identity.phone())) {
            user.setPhone(sanitizePhone(identity.phone()));
            changed = true;
        }

        return changed ? userRepository.save(user) : user;
    }

    public String sanitizePhone(String rawPhone) {
        if (isBlank(rawPhone)) {
            return null;
        }
        String trimmed = rawPhone.trim();
        if (PHONE_PATTERN.matcher(trimmed).matches()) {
            return trimmed;
        }
        if (TEN_DIGITS_PATTERN.matcher(trimmed).matches()) {
            return "+91 " + trimmed;
        }

        log.warn("Phone '{}' does not match required format; leaving as null", rawPhone);
        return null;
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
