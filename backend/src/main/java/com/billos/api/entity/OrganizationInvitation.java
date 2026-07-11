package com.billos.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_invitations")
@Getter
@Setter
public class OrganizationInvitation extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "expires_at", nullable = false)
    private ZonedDateTime expiresAt;
}
