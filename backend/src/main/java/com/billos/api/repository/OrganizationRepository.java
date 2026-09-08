package com.billos.api.repository;

import com.billos.api.entity.Organization;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    List<Organization> findByParentOrganizationId(UUID parentOrganizationId);

    List<Organization> findByParentOrganizationIdIn(List<UUID> parentOrganizationIds);
}
