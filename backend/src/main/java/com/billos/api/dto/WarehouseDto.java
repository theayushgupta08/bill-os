package com.billos.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

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
    /**
     * Lombok names the accessors isActive()/setActive(), which Jackson would expose as "active" — so the
     * "isActive" the frontend sends was silently ignored. Pin the JSON name on both accessors.
     */
    @Getter(onMethod_ = @JsonProperty("isActive"))
    @Setter(onMethod_ = @JsonProperty("isActive"))
    private boolean isActive = true;
}
