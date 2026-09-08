package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class TaxSlabDto {
    private String name;
    private BigDecimal rate;
    private BigDecimal cgstRate;
    private BigDecimal sgstRate;
    private BigDecimal igstRate;
}
