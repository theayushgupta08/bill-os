package com.billos.api.service;

import com.billos.api.dto.NotificationDto;
import com.billos.api.entity.Notification;
import com.billos.api.entity.User;
import com.billos.api.repository.NotificationRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.tenant.TenantContext;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendNotification(
            UUID userId, String type, String title, String message, String entityType, UUID entityId) {
        String tenantStr = TenantContext.getCurrentTenant();
        if (tenantStr == null) return;
        UUID orgId = UUID.fromString(tenantStr);

        User recipient =
                userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Recipient user not found"));

        Notification notification = new Notification();
        notification.setOrganizationId(orgId);
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID id) {
        Notification notification =
                notificationRepository.findById(id).orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setReadAt(OffsetDateTime.now());
        notificationRepository.save(notification);
    }

    private NotificationDto toDto(Notification entity) {
        return new NotificationDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getReadAt(),
                entity.getCreatedAt());
    }
}
