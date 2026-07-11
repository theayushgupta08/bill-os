package com.billos.api.service;

import com.billos.api.dto.AuditLogDto;
import com.billos.api.entity.AuditLog;
import com.billos.api.mapper.AuditLogMapper;
import com.billos.api.repository.AuditLogRepository;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @Transactional
    public void logAction(String entityType, UUID entityId, String action, String details) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        
        AuditLog log = new AuditLog();
        log.setOrganizationId(orgId);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setDetails(details);
        
        // TODO: Get real userId from SecurityContext if available
        // log.setUserId(currentUserId);
        
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(auditLogMapper::toDto)
                .collect(Collectors.toList());
    }
}
