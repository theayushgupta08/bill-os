package com.billos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePhoneRequest {

    @NotBlank(message = "Phone number is required")
    @Pattern(
            regexp = "^\\+\\d{1,4} ?\\d{4,14}$",
            message = "Phone must be in format: Country Code + Phone (e.g. +91 9876543210)")
    private String phone;
}
