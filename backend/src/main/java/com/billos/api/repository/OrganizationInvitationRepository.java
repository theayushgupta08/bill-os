package com.billos.api.repository;

import com.billos.api.entity.OrganizationInvitation;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationInvitationRepository extends JpaRepository<OrganizationInvitation, UUID> {

    List<OrganizationInvitation> findByOrganizationId(UUID organizationId);

    Optional<OrganizationInvitation> findByToken(String token);

    Optional<OrganizationInvitation> findByOrganizationIdAndEmailAndStatus(
            UUID organizationId, String email, String status);

    List<OrganizationInvitation> findByEmailIgnoreCaseAndStatus(String email, String status);
}
