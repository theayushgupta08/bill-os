package com.billos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateMemberRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^\\+\\d{1,4} ?\\d{4,14}$",
            message = "Phone must be in format: Country Code + Phone (e.g. +91 9876543210)")
    private String phone;

    @NotBlank(message = "Role is required")
    private String role;
}
