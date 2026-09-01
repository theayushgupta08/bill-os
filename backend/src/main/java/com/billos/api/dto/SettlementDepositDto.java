package com.billos.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDepositDto {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private BigDecimal amount;
    private LocalDate depositDate;
    private String referenceNumber;
    private String notes;
    private String attachmentUrl;
    private String status;
    private UUID approvedById;
    private OffsetDateTime approvedAt;
}
