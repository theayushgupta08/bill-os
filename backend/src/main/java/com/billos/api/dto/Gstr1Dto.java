package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class Gstr1Dto {
    private String customerGstin;
    private String customerName;
    private String invoiceNumber;
    private String invoiceDate;
    private BigDecimal taxableValue = BigDecimal.ZERO;
    private BigDecimal cgstAmount = BigDecimal.ZERO;
    private BigDecimal sgstAmount = BigDecimal.ZERO;
    private BigDecimal igstAmount = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;
}
