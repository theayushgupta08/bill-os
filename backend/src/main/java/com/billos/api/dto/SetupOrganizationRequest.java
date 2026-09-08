package com.billos.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.Data;

@Data
public class SetupOrganizationRequest {

    // Business Identity & Details
    @NotBlank(message = "Business name is required")
    private String name;

    private String legalName;

    @NotBlank(message = "GSTIN is required")
    @Pattern(
            regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
            message = "Invalid GSTIN format (must be 15 characters, e.g. 22AAAAA0000A1Z5)")
    private String gstin;

    @NotBlank(message = "Address Line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Pincode is required")
    private String pincode;

    private String email;

    @NotBlank(message = "Primary business phone is required")
    @Pattern(
            regexp = "^\\+\\d{1,4} ?\\d{4,14}$",
            message = "Phone must be in format: Country Code + Phone (e.g. +91 XXXXXXXXXX)")
    private String phone;

    private List<String> secondaryPhones;

    private String website;

    private String logoUrl;

    // Organisation Settings
    private String dateFormat = "DD/MM/YYYY";
    private String invoicePrefix = "INV-";
    private List<String> invoiceTerms;
    private BankDetailsDto bankDetails;
    private String timezone = "Asia/Kolkata";
    private String language = "en";

    // Tax Slabs
    private List<TaxSlabDto> taxSlabs;

    // Warehouses
    private List<WarehouseSetupDto> warehouses;
}
