package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TaxRateDto {
    private UUID id;
    private String name;
    private BigDecimal rate;
    private boolean isActive;
}
