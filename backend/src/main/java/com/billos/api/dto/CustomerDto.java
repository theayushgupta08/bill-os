package com.billos.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomerDto {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String gstin;
    private String pan;

    private String billingAddressLine1;
    private String billingAddressLine2;
    private String billingCity;
    private String billingState;
    private String billingPincode;
    private String billingCountry;

    private String shippingAddressLine1;
    private String shippingAddressLine2;
    private String shippingCity;
    private String shippingState;
    private String shippingPincode;
    private String shippingCountry;

    private BigDecimal outstandingBalance;
    private UUID organizationId;
    private Boolean isShared;
    private UUID originatingOrgId;
    private String originatingBranchName;
}
