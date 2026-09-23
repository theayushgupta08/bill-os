package com.billos.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class WarehouseSetupDto {
    private String name;
    private String code;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String pincode;
    /**
     * Lombok names the accessors isPrimary()/setPrimary(), which Jackson would expose as "primary" — so the
     * "isPrimary" the frontend sends was silently ignored. Pin the JSON name on both accessors.
     */
    @Getter(onMethod_ = @JsonProperty("isPrimary"))
    @Setter(onMethod_ = @JsonProperty("isPrimary"))
    private boolean isPrimary;
}
