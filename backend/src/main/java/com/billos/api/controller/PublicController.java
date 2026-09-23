package com.billos.api.controller;

import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.bind.annotation.*;

/**
 * Public endpoints that do NOT require authentication.
 * Must be registered in SecurityConfig under permitAll.
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicController {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final JwtDecoder jwtDecoder;

    /**
     * Check if an email suffix is available for a new organization.
     */
    @GetMapping("/check-suffix")
    public ResponseEntity<Map<String, Object>> checkSuffix(@RequestParam String suffix) {
        String cleaned = suffix.trim().toLowerCase();
        if (!cleaned.matches("^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$")) {
            return ResponseEntity.ok(Map.of(
                    "available",
                    false,
                    "reason",
                    "Suffix must be 3-30 chars: lowercase letters, numbers, and hyphens only"));
        }
        boolean taken = organizationRepository.existsByEmailSuffix(cleaned);
        if (taken) {
            return ResponseEntity.ok(Map.of("available", false, "reason", "This suffix is already in use"));
        }
        return ResponseEntity.ok(Map.of("available", true));
    }

    /**
     * Check whether the holder of a Supabase access token already has a billOS account. Used by the auth
     * callback to block unknown Google OAuth logins from creating orphan accounts.
     *
     * <p>Takes the token in the body rather than an email parameter so it can only answer for the caller's own
     * (verified) email — an email parameter lets anyone enumerate registered users. It is deliberately not an
     * authenticated endpoint: authenticating a request JIT-provisions the user, which would defeat the check.
     */
    @PostMapping("/check-user-exists")
    public ResponseEntity<Map<String, Object>> checkUserExists(@RequestBody Map<String, String> body) {
        String token = body.get("accessToken");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "accessToken is required"));
        }

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(token);
        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid access token"));
        }

        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token has no email claim"));
        }

        boolean exists = userRepository.existsByEmail(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
