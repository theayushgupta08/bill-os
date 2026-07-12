package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class TaxRateDto {
    private UUID id;
    private String name;
    private BigDecimal rate;
    private boolean isActive;
}
