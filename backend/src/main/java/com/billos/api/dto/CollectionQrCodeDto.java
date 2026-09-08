package com.billos.api.dto;

import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollectionQrCodeDto {
    private UUID id;
    private UUID userId;
    private String userEmail;
    private String userFirstName;
    private String userLastName;
    private String paymentProvider;
    private String upiName;
    private String upiId;
    private String nickname;
    private String qrImageUrl;
    private Boolean isActive;
    private String notes;
    private UUID organizationId;
    private Boolean isShared;
    private Boolean isMasterShared;
}
