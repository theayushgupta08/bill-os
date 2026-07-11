package com.billos.api.mapper;

import com.billos.api.dto.AuditLogDto;
import com.billos.api.entity.AuditLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {
    AuditLogDto toDto(AuditLog entity);
    AuditLog toEntity(AuditLogDto dto);
}
