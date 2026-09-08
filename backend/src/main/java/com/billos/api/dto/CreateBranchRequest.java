package com.billos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.Data;

@Data
public class CreateBranchRequest {
    @NotBlank(message = "Branch name is required")
    private String name;

    private String legalName;

    private String branchCode;

    private String gstin;

    @NotBlank(message = "Branch phone is required")
    @Pattern(
            regexp = "^\\+\\d{1,4} ?\\d{4,14}$",
            message = "Phone must be in format: Country Code + Phone (e.g. +91 XXXXXXXXXX)")
    private String phone;

    private List<String> secondaryPhones;

    private String email;

    private String addressLine1;

    private String addressLine2;

    private String city;

    private String state;

    private String pincode;

    private String country;

    private String website;

    private String logoUrl;
}
