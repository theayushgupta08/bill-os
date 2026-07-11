package com.billos.api.dto;

import com.billos.api.entity.SalesOrderStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class SalesOrderDto {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID quoteId;
    private String soNumber;
    private LocalDate orderDate;
    private SalesOrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal totalAmount;
    private String notes;
    private List<SalesOrderLineDto> lines = new ArrayList<>();
}
