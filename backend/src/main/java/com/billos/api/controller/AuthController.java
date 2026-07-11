package com.billos.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        // TODO: Implement actual authentication
        return ResponseEntity.ok(Map.of(
                "token", "dummy.jwt.token",
                "refreshToken", "dummy.refresh.token",
                "user", Map.of(
                        "id", UUID.randomUUID().toString(),
                        "email", request.getOrDefault("email", "test@example.com"),
                        "firstName", "Test",
                        "lastName", "User"
                )
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        // TODO: Implement actual registration
        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "userId", UUID.randomUUID().toString()
        ));
    }
}
