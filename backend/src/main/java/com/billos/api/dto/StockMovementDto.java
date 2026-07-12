package com.billos.api.dto;

import com.billos.api.entity.MovementType;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class StockMovementDto {
    private UUID id;
    private UUID warehouseId;
    private String warehouseName;
    private UUID productId;
    private String productName;
    private MovementType movementType;
    private BigDecimal quantity;
    private String referenceType;
    private UUID referenceId;
    private BigDecimal unitCost;
    private String reason;
    private OffsetDateTime createdAt;
}
