package com.billos.api.repository;

import com.billos.api.entity.OrganizationSettings;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, UUID> {
    Optional<OrganizationSettings> findByOrganizationId(UUID organizationId);
}
