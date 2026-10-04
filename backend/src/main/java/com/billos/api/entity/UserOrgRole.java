package com.billos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A user's membership of one organization. Deliberately <b>not</b> {@code @TenantId}: membership is what decides
 * which tenants a user may enter, so it must be readable across organizations (the org switcher, parent-role
 * inheritance, {@code /organizations/{id}} checks). Always query it with an explicit organization
 * ({@code findByOrganizationId}, {@code findByUserIdAndOrganizationId}) — never {@code findAll()}.
 */
@Entity
@Table(name = "user_org_roles")
@Getter
@Setter
public class UserOrgRole extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String role;

    /** Deactivating a member is per organization; it never touches their other memberships (V027). */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public boolean isActiveMembership() {
        return !Boolean.FALSE.equals(isActive);
    }
}
