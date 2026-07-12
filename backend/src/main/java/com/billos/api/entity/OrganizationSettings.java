package com.billos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "organization_settings")
@Getter
@Setter
@SQLDelete(sql = "UPDATE organization_settings SET deleted_at = CURRENT_TIMESTAMP WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
public class OrganizationSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false, unique = true)
    private UUID organizationId;

    @Column(name = "default_gst_rate")
    private BigDecimal defaultGstRate;

    @Column(name = "tax_inclusive_pricing")
    private Boolean taxInclusivePricing = false;

    @Column(name = "invoice_prefix")
    private String invoicePrefix;

    @Column(name = "invoice_number_format")
    private String invoiceNumberFormat;

    @Column(name = "invoice_terms")
    private String invoiceTerms;

    @Column(name = "bank_details")
    private String bankDetails;

    private String theme = "light";
    private String language = "en";
    private String timezone = "Asia/Kolkata";

    @Column(name = "date_format")
    private String dateFormat = "DD/MM/YYYY";
}
