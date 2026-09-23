package com.billos.api.dto;

import com.billos.api.entity.PurchaseBillStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class PurchaseBillDto {
    private UUID id;
    private UUID supplierId;
    private String supplierName;
    private UUID poId;
    private String poNumber;
    private String billNumber;
    private LocalDate billDate;
    private LocalDate dueDate;
    private PurchaseBillStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private String notes;
    private List<PurchaseBillLineDto> lines;
}
