package com.billos.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "collection_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionLedger {

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
    private String type; // COLLECTION, EXPENSE, DEPOSIT, ADJUSTMENT, TRANSFER, REFUND

    @Column(nullable = false)
    private BigDecimal amount; // Positive for balance additions, negative for reductions

    @Column(name = "reference_id", nullable = false)
    private UUID referenceId; // Points to payment, expense, or settlement deposit PK

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
