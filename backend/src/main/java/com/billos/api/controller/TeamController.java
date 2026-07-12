package com.billos.api.controller;

import com.billos.api.dto.InviteUserRequest;
import com.billos.api.dto.TeamMemberDto;
import com.billos.api.dto.UpdateRoleRequest;
import com.billos.api.service.TeamService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<TeamMemberDto>> getTeamMembers() {
        return ResponseEntity.ok(teamService.getTeamMembers());
    }

    @PostMapping("/invite")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> inviteUser(@Valid @RequestBody InviteUserRequest request) {
        teamService.inviteUser(request);
        return ResponseEntity.ok(Map.of("message", "Invitation sent successfully"));
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<Map<String, String>> acceptInvitation(@RequestParam String token) {
        teamService.acceptInvitation(token);
        return ResponseEntity.ok(Map.of("message", "Invitation accepted successfully"));
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable UUID userId, @Valid @RequestBody UpdateRoleRequest request) {
        teamService.updateUserRole(userId, request.getRole());
        return ResponseEntity.ok(Map.of("message", "User role updated successfully"));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<Void> removeUser(@PathVariable UUID userId) {
        teamService.removeUser(userId);
        return ResponseEntity.noContent().build();
    }
}
