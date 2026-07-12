package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class PurchaseBillLineDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID warehouseId;
    private String warehouseName;
    private UUID taxRateId;
    private String taxRateName;
    private BigDecimal taxRate;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal lineTotal;
}
