package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class InventoryLevelDto {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productName;
    private String productCode;
    private BigDecimal quantity;
    private BigDecimal reorderLevel;
}
