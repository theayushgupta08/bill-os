package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PurchaseOrderLineDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID taxRateId;
    private String taxRateName;
    private BigDecimal taxRate;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
}
