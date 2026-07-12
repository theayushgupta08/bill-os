package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class OrganizationSettingsDto {
    private UUID id;
    private UUID organizationId;

    // Tax Settings
    private BigDecimal defaultGstRate;
    private Boolean taxInclusivePricing;

    // Invoice Settings
    private String invoicePrefix;
    private String invoiceNumberFormat;
    private String invoiceTerms;
    private String bankDetails;

    // Preferences Settings
    private String theme;
    private String language;
    private String timezone;
    private String dateFormat;
}
