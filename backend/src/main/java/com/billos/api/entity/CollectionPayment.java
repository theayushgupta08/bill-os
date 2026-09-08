package com.billos.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "collection_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionPayment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_code_id", nullable = false)
    private CollectionQrCode qrCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_id", nullable = false)
    private User recordedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qr_owner_id", nullable = false)
    private User qrOwner;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String place; // SHOP, ONLINE, FIELD_VISIT, OTHER

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    @Column(name = "utr_number")
    private String utrNumber;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "screenshot_url")
    private String screenshotUrl;

    @Column(nullable = false)
    private String status = "PENDING_VERIFICATION"; // PENDING_VERIFICATION, VERIFIED, REJECTED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verified_by_id")
    private User verifiedBy;

    @Column(name = "verified_at")
    private OffsetDateTime verifiedAt;

    private String remarks;

    @Column(name = "collecting_organization_id")
    private UUID collectingOrganizationId;
}
