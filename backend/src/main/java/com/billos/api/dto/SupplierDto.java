package com.billos.api.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class SupplierDto {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String gstin;
    
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    private String country;
}
