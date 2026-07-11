package com.billos.api.repository;

import com.billos.api.entity.UserOrgRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOrgRoleRepository extends JpaRepository<UserOrgRole, UUID> {
    List<UserOrgRole> findByUserId(UUID userId);
    Optional<UserOrgRole> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}
