package com.billos.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Data;

@Data
public class AuditLogDto {
    private UUID id;
    private UUID userId;
    /** Display name of userId, resolved by AuditLogService. */
    private String userName;

    private String entityType;
    private UUID entityId;
    private String action;
    private String details;
    private OffsetDateTime createdAt;
}
