package com.billos.api.controller;

import com.billos.api.entity.Organization;
import com.billos.api.repository.OrganizationInvitationRepository;
import com.billos.api.repository.OrganizationRepository;
import java.time.ZonedDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public (unauthenticated) endpoint to return minimal invitation metadata given a token.
 *
 * <p>Only exposes the invited email, organization name, and assigned role — nothing sensitive.
 * This lets the frontend pre-fill the email field on the registration page for invited users.
 */
@RestController
@RequestMapping("/api/v1/public/invite-info")
@RequiredArgsConstructor
public class InviteInfoController {

    private final OrganizationInvitationRepository invitationRepository;
    private final OrganizationRepository organizationRepository;

    @GetMapping
    public ResponseEntity<?> getInviteInfo(@RequestParam String token) {
        return invitationRepository
                .findByToken(token)
                .map(invitation -> {
                    if (!"PENDING".equals(invitation.getStatus())
                            || invitation.getExpiresAt().isBefore(ZonedDateTime.now())) {
                        return ResponseEntity.ok(
                                Map.of("valid", false, "reason", "Invitation has expired or is no longer valid"));
                    }

                    String orgName = organizationRepository
                            .findById(invitation.getOrganizationId())
                            .map(Organization::getName)
                            .orElse("Unknown Organization");

                    return ResponseEntity.ok(Map.of(
                            "valid",
                            true,
                            "email",
                            invitation.getEmail(),
                            "orgName",
                            orgName,
                            "role",
                            invitation.getRole()));
                })
                .orElse(ResponseEntity.ok(Map.of("valid", false, "reason", "Invalid invitation token")));
    }
}
