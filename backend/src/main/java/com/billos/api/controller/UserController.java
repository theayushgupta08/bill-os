package com.billos.api.controller;

import com.billos.api.dto.UpdatePhoneRequest;
import com.billos.api.dto.UpdateProfileRequest;
import com.billos.api.dto.UserProfileDto;
import com.billos.api.entity.User;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import com.billos.api.service.SupabaseAdminService;
import com.billos.api.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final SupabaseAdminService supabaseAdminService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMyProfile() {
        return ResponseEntity.ok(userService.getCurrentUserProfile());
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileDto> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PutMapping("/me/phone")
    public ResponseEntity<UserProfileDto> updateMyPhone(@Valid @RequestBody UpdatePhoneRequest request) {
        return ResponseEntity.ok(userService.updatePhone(request.getPhone()));
    }

    @GetMapping("/me/must-change-password")
    public ResponseEntity<Map<String, Boolean>> mustChangePassword() {
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository
                .findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(Map.of("mustChangePassword", Boolean.TRUE.equals(user.getMustChangePassword())));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
        }

        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository
                .findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getSupabaseId() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Cannot change password — no auth account linked"));
        }

        supabaseAdminService.updatePassword(user.getSupabaseId(), newPassword);
        user.setMustChangePassword(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
