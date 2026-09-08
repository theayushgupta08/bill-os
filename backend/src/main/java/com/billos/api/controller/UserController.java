package com.billos.api.controller;

import com.billos.api.dto.UpdatePhoneRequest;
import com.billos.api.dto.UpdateProfileRequest;
import com.billos.api.dto.UserProfileDto;
import com.billos.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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
}
