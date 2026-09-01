package com.billos.api.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "collection_qr_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CollectionQrCode extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "payment_provider", nullable = false)
    private String paymentProvider; // UPI, PHONEPE, GOOGLEPAY, PAYTM, BHIM, OTHER

    @Column(name = "upi_name", nullable = false)
    private String upiName;

    @Column(name = "upi_id", nullable = false)
    private String upiId;

    @Column(nullable = false)
    private String nickname;

    @Column(name = "qr_image_url")
    private String qrImageUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    private String notes;
}
