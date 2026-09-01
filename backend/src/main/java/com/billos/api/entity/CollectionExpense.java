package com.billos.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "collection_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionExpense extends BaseEntity {

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
    private String category; // FUEL, PACKING, TRAVEL, FOOD, COURIER, MISC

    @Column(nullable = false)
    private String vendor;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    private String notes;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(nullable = false)
    private String status = "SUBMITTED"; // DRAFT, SUBMITTED, APPROVED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
}
