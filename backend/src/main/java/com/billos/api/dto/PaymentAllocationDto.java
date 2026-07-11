package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentAllocationDto {
    private UUID id;
    private UUID salesInvoiceId;
    private String invoiceNumber;
    private UUID purchaseBillId;
    private String billNumber;
    private BigDecimal allocatedAmount;
}
