package com.billos.api.dto;

import com.billos.api.entity.SalesInvoiceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class SalesInvoiceDto {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID soId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private SalesInvoiceStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private String notes;
    private List<SalesInvoiceLineDto> lines = new ArrayList<>();
}
