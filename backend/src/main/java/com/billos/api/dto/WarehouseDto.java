package com.billos.api.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class WarehouseDto {
    private UUID id;
    private String name;
    private String code;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private boolean isActive;
}
