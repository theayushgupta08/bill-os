package com.billos.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.billos.api.dto.UpdatePhoneRequest;
import com.billos.api.dto.UserProfileDto;
import com.billos.api.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private static final UUID USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    @DisplayName("GET /api/v1/users/me should return current user profile")
    void shouldReturnProfile() throws Exception {
        UserProfileDto dto = UserProfileDto.builder()
                .id(USER_ID)
                .email("user@example.com")
                .firstName("John")
                .lastName("Doe")
                .phone("+91 9876543210")
                .isActive(true)
                .isEmailVerified(true)
                .build();

        when(userService.getCurrentUserProfile()).thenReturn(dto);

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(USER_ID.toString()))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.phone").value("+91 9876543210"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me/phone should update phone when valid")
    void shouldUpdatePhoneWhenValid() throws Exception {
        UserProfileDto dto = UserProfileDto.builder()
                .id(USER_ID)
                .email("user@example.com")
                .firstName("John")
                .lastName("Doe")
                .phone("+91 9876543210")
                .isActive(true)
                .isEmailVerified(true)
                .build();

        when(userService.updatePhone(anyString())).thenReturn(dto);

        UpdatePhoneRequest req = new UpdatePhoneRequest("+91 9876543210");

        mockMvc.perform(put("/api/v1/users/me/phone")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+91 9876543210"));
    }

    @Test
    @DisplayName("PUT /api/v1/users/me should update profile when valid")
    void shouldUpdateProfileWhenValid() throws Exception {
        UserProfileDto dto = UserProfileDto.builder()
                .id(USER_ID)
                .email("user@example.com")
                .firstName("Ayush")
                .lastName("Gupta")
                .phone("+91 9876543210")
                .isActive(true)
                .isEmailVerified(true)
                .build();

        when(userService.updateProfile(any(com.billos.api.dto.UpdateProfileRequest.class)))
                .thenReturn(dto);

        com.billos.api.dto.UpdateProfileRequest req = com.billos.api.dto.UpdateProfileRequest.builder()
                .firstName("Ayush")
                .lastName("Gupta")
                .phone("+91 9876543210")
                .build();

        mockMvc.perform(put("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ayush"))
                .andExpect(jsonPath("$.lastName").value("Gupta"))
                .andExpect(jsonPath("$.phone").value("+91 9876543210"));
    }
}
