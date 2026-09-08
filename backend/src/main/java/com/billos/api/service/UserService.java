package com.billos.api.service;

import com.billos.api.dto.UpdateProfileRequest;
import com.billos.api.dto.UserProfileDto;
import com.billos.api.entity.User;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        User user = getCurrentUser();
        return toDto(user);
    }

    @Transactional
    public UserProfileDto updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            user.setPhone(request.getPhone().trim());
        } else if (request.getPhone() != null && request.getPhone().trim().isEmpty()) {
            user.setPhone(null);
        }
        User saved = userRepository.save(user);
        log.info("Updated personal profile for user {}", saved.getId());
        return toDto(saved);
    }

    @Transactional
    public UserProfileDto updatePhone(String phone) {
        User user = getCurrentUser();
        String trimmed = phone != null ? phone.trim() : null;
        user.setPhone(trimmed);
        User saved = userRepository.save(user);
        log.info("Updated phone number for user {}", saved.getId());
        return toDto(saved);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("No authenticated user found in security context");
        }
        return userRepository
                .findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("User not found with id: " + principal.getId()));
    }

    private UserProfileDto toDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .isActive(user.getIsActive())
                .isEmailVerified(user.getIsEmailVerified())
                .build();
    }
}
