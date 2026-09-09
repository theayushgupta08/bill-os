package com.billos.api.controller;

import com.billos.api.dto.NotificationDto;
import com.billos.api.security.UserPrincipal;
import com.billos.api.service.NotificationService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<NotificationDto>> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext()
                            .getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal p) {
                principal = p;
            }
        }
        if (principal == null) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(notificationService.getNotificationsForUser(principal.getId()));
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable UUID id) {
        try {
            notificationService.markAsRead(id);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("message", "Notification could not be updated"));
        }
    }
}
