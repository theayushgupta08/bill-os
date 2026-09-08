package com.billos.api.dto;

import lombok.Data;

@Data
public class WarehouseSetupDto {
    private String name;
    private String code;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private boolean isPrimary;
}
