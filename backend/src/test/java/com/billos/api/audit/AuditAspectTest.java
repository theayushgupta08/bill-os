package com.billos.api.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.billos.api.security.UserPrincipal;
import com.billos.api.service.AuditLogService;
import com.billos.api.tenant.TenantContext;
import java.lang.annotation.Annotation;
import java.util.Collections;
import java.util.UUID;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuditAspectTest {

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private JoinPoint joinPoint;

    @InjectMocks
    private AuditAspect aspect;

    private final UUID orgId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    /** Stand-ins for DTOs returned by audited methods. */
    public static class Invoice {
        private final UUID id;

        Invoice(UUID id) {
            this.id = id;
        }

        public UUID getId() {
            return id;
        }

        public String getInvoiceNumber() {
            return "INV-0042";
        }
    }

    public static class Credentials {
        public String getTemporaryPassword() {
            return "s3cret!";
        }
    }

    private static Audited audited(String entity, String action) {
        return new Audited() {
            public String entity() {
                return entity;
            }

            public String action() {
                return action;
            }

            public Class<? extends Annotation> annotationType() {
                return Audited.class;
            }
        };
    }

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(orgId.toString());
        UserPrincipal principal = new UserPrincipal(userId, "a@b.com", null, Collections.emptyList(), true);
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void shouldLogIdAndDocumentNumber_fromReturnedDto_unwrappingResponseEntity() {
        UUID invoiceId = UUID.randomUUID();
        when(joinPoint.getArgs()).thenReturn(new Object[] {});

        aspect.record(joinPoint, audited("SalesInvoice", "ISSUE"), ResponseEntity.ok(new Invoice(invoiceId)));

        verify(auditLogService).logAction(orgId, userId, "SalesInvoice", invoiceId, "ISSUE", "INV-0042");
    }

    @Test
    void shouldFallBackToUuidArgument_forVoidMethods() {
        UUID customerId = UUID.randomUUID();
        when(joinPoint.getArgs()).thenReturn(new Object[] {customerId});

        aspect.record(joinPoint, audited("Customer", "DELETE"), null);

        verify(auditLogService).logAction(orgId, userId, "Customer", customerId, "DELETE", null);
    }

    @Test
    void shouldWriteOnlyAfterCommit_whenInsideATransaction() {
        TransactionSynchronizationManager.initSynchronization();
        when(joinPoint.getArgs()).thenReturn(new Object[] {UUID.randomUUID()});

        aspect.record(joinPoint, audited("Customer", "DELETE"), null);
        verifyNoInteractions(auditLogService);

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(auditLogService).logAction(eq(orgId), eq(userId), eq("Customer"), any(), eq("DELETE"), any());
    }

    @Test
    void shouldNeverLogSecretsFromResults() {
        assertThat(AuditAspect.describe(new Credentials(), new Object[] {UUID.randomUUID()}))
                .isNull();
        assertThat(AuditAspect.describe("temp-password-123", new Object[] {})).isNull();
    }

    @Test
    void shouldSwallowAuditFailures_soTheBusinessActionIsUnaffected() {
        when(joinPoint.getArgs()).thenReturn(new Object[] {UUID.randomUUID()});
        doThrow(new RuntimeException("db down"))
                .when(auditLogService)
                .logAction(any(), any(), any(), any(), any(), any());

        aspect.record(joinPoint, audited("Customer", "DELETE"), null); // must not throw
    }
}
