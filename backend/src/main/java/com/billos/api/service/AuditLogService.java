package com.billos.api.service;

import com.billos.api.dto.AuditLogDto;
import com.billos.api.entity.AuditLog;
import com.billos.api.entity.User;
import com.billos.api.mapper.AuditLogMapper;
import com.billos.api.repository.AuditLogRepository;
import com.billos.api.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;
    private final UserRepository userRepository;

    /**
     * Records an action with explicit context. Runs in its own transaction because {@code AuditAspect} calls it
     * after the business transaction has committed.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(UUID orgId, UUID userId, String entityType, UUID entityId, String action, String details) {
        AuditLog log = new AuditLog();
        log.setOrganizationId(orgId);
        log.setUserId(userId);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setDetails(details != null && details.length() > 500 ? details.substring(0, 500) : details);

        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentLogs() {
        List<AuditLogDto> logs = auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(auditLogMapper::toDto)
                .collect(Collectors.toList());

        // One lookup for every user on the page, not one per row
        Set<UUID> userIds = logs.stream()
                .map(AuditLogDto::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> names = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, AuditLogService::displayName));
        logs.forEach(l -> l.setUserName(l.getUserId() == null ? "System" : names.get(l.getUserId())));
        return logs;
    }

    private static String displayName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                        + (user.getLastName() == null ? "" : user.getLastName()))
                .trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
