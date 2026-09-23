package com.billos.api.audit;

import com.billos.api.security.UserPrincipal;
import com.billos.api.service.AuditLogService;
import com.billos.api.tenant.TenantContext;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Writes an audit log entry for every {@link Audited} method that returns normally.
 *
 * <p>The entry is written after the surrounding transaction commits (or immediately when there is none), so only
 * changes that actually happened are recorded, and a failure to write the log can never roll back the change.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    /**
     * Getters that identify a record for humans. Deliberately an allow-list: some results (e.g. new-member
     * credentials) carry secrets that must never end up in the audit trail.
     */
    private static final List<String> LABEL_GETTERS = List.of(
            "getInvoiceNumber",
            "getBillNumber",
            "getPoNumber",
            "getSoNumber",
            "getQuoteNumber",
            "getPaymentNumber",
            "getEntryNumber",
            "getSku",
            "getName",
            "getEmail");

    private final AuditLogService auditLogService;

    @AfterReturning(pointcut = "@annotation(audited)", returning = "result")
    public void record(JoinPoint joinPoint, Audited audited, Object result) {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            return; // not an org-scoped operation (e.g. onboarding) — nothing to attach the entry to
        }

        Object body = result instanceof ResponseEntity<?> response ? response.getBody() : result;
        UUID entityId = idOf(body);
        if (entityId == null) {
            entityId = Stream.of(joinPoint.getArgs())
                    .filter(UUID.class::isInstance)
                    .map(UUID.class::cast)
                    .findFirst()
                    .orElse(null);
        }

        UUID orgId = UUID.fromString(tenant);
        UUID userId = currentUserId();
        UUID id = entityId;
        String details = describe(body, joinPoint.getArgs());
        Runnable write = () -> {
            try {
                auditLogService.logAction(orgId, userId, audited.entity(), id, audited.action(), details);
            } catch (RuntimeException e) {
                log.warn("Failed to write audit log for {} {} {}", audited.action(), audited.entity(), id, e);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    write.run();
                }
            });
        } else {
            write.run();
        }
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof UserPrincipal principal ? principal.getId() : null;
    }

    private static UUID idOf(Object body) {
        Object value = invokeGetter(body, "getId");
        return value instanceof UUID uuid ? uuid : null;
    }

    /** A short human label (document number / name), or the simple non-id arguments (e.g. a new role). */
    static String describe(Object body, Object[] args) {
        if (body != null && !(body instanceof String)) {
            for (String getter : LABEL_GETTERS) {
                Object value = invokeGetter(body, getter);
                if (value != null && !value.toString().isBlank()) {
                    return value.toString();
                }
            }
        }
        String simpleArgs = Stream.of(args)
                .filter(a -> a instanceof Boolean || a instanceof Enum<?> || a instanceof String)
                .map(Objects::toString)
                .collect(Collectors.joining(", "));
        return simpleArgs.isEmpty() ? null : simpleArgs;
    }

    private static Object invokeGetter(Object target, String name) {
        if (target == null) {
            return null;
        }
        try {
            Method method = target.getClass().getMethod(name);
            return method.invoke(target);
        } catch (ReflectiveOperationException e) {
            return null;
        }
    }
}
