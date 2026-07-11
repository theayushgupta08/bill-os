package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class SalesInvoiceLineDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID warehouseId;
    private String warehouseName;
    private UUID taxRateId;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
}
