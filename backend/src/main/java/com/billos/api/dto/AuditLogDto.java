package com.billos.api.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class AuditLogDto {
    private UUID id;
    private UUID userId;
    private String entityType;
    private UUID entityId;
    private String action;
    private String details;
    private OffsetDateTime createdAt;
}
