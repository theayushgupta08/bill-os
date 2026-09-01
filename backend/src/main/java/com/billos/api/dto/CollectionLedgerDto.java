package com.billos.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionLedgerDto {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String type;
    private BigDecimal amount;
    private UUID referenceId;
    private String notes;
    private OffsetDateTime createdAt;
}
