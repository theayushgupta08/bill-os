package com.billos.api.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionPaymentDto {
    private UUID id;
    private UUID customerId;
    private String customerName;
    private UUID qrCodeId;
    private String qrCodeNickname;
    private UUID recordedById;
    private String recordedByEmail;
    private UUID qrOwnerId;
    private String qrOwnerEmail;
    private BigDecimal amount;
    private String place;
    private OffsetDateTime recordedAt;
    private String utrNumber;
    private String referenceNumber;
    private String screenshotUrl;
    private String status;
    private UUID verifiedById;
    private OffsetDateTime verifiedAt;
    private String remarks;
}
