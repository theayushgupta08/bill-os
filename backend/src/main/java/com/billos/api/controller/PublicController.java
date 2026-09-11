package com.billos.api.controller;

import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
     * Check if a user exists by email. Used by the auth callback to block
     * unknown Google OAuth logins from creating orphan accounts.
     */
    @GetMapping("/check-user-exists")
    public ResponseEntity<Map<String, Boolean>> checkUserExists(@RequestParam String email) {
        boolean exists = userRepository.existsByEmail(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
