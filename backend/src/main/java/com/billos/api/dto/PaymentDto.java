package com.billos.api.dto;

import com.billos.api.entity.PaymentType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class PaymentDto {
    private UUID id;
    private String paymentNumber;
    private LocalDate paymentDate;
    private PaymentType paymentType;
    private String referenceNumber;
    private BigDecimal amount;
    private String notes;
    private List<PaymentAllocationDto> allocations = new ArrayList<>();
}
