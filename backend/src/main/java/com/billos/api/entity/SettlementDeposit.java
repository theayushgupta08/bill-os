package com.billos.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "settlement_deposits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SettlementDeposit extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "deposit_date", nullable = false)
    private LocalDate depositDate;

    @Column(name = "reference_number", nullable = false)
    private String referenceNumber;

    private String notes;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(nullable = false)
    private String status = "PENDING_APPROVAL"; // PENDING_APPROVAL, APPROVED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
}
