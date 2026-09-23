package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.Data;

/** One row of the GSTR-1 HSN-wise summary of outward supplies: an HSN/SAC code at one tax rate. */
@Data
public class HsnSummaryDto {
    private String hsnSac;
    private String description;
    /** Unit quantity code, from the product's unit of measure. */
    private String uqc;

    private BigDecimal taxRate;
    private BigDecimal totalQuantity = BigDecimal.ZERO;
    private BigDecimal taxableValue = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalTax = BigDecimal.ZERO;
    private BigDecimal totalValue = BigDecimal.ZERO;
}
