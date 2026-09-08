package com.billos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "organizations")
@Getter
@Setter
@SQLDelete(sql = "UPDATE organizations SET deleted_at = CURRENT_TIMESTAMP WHERE id=?")
@SQLRestriction("deleted_at IS NULL")
public class Organization extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String gstin;
    private String pan;

    @Column(name = "legal_name")
    private String legalName;

    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    private String city;
    private String state;
    private String pincode;
    private String country;

    @NotBlank(message = "Primary business phone is required")
    @Pattern(
            regexp = "^\\+\\d{1,4} ?\\d{4,14}$",
            message = "Phone must be in format: Country Code + Phone (e.g. +91 XXXXXXXXXX)")
    @Column(nullable = false)
    private String phone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "secondary_phones", columnDefinition = "jsonb")
    private List<String> secondaryPhones;

    private String email;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "website")
    private String website;

    @Column(name = "financial_year_start")
    private LocalDate financialYearStart;

    @Column(name = "parent_organization_id")
    private UUID parentOrganizationId;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "branch_code")
    private String branchCode;
}
