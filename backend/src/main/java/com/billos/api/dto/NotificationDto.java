package com.billos.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private UUID userId;
    private String type;
    private String title;
    private String message;
    private String entityType;
    private UUID entityId;
    private OffsetDateTime readAt;
    private OffsetDateTime createdAt;
}
