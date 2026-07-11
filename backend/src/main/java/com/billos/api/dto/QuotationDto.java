package com.billos.api.dto;

import com.billos.api.entity.QuotationStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class QuotationDto {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private String quoteNumber;
    private LocalDate quoteDate;
    private LocalDate expiryDate;
    private QuotationStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxTotal;
    private BigDecimal totalAmount;
    private String notes;
    private List<QuotationLineDto> lines = new ArrayList<>();
}
