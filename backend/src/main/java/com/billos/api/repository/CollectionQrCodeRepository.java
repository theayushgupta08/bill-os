package com.billos.api.repository;

import com.billos.api.entity.CollectionQrCode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionQrCodeRepository extends JpaRepository<CollectionQrCode, UUID> {
    List<CollectionQrCode> findByUserId(UUID userId);

    @Query(
            "SELECT q FROM CollectionQrCode q WHERE q.organizationId = :currentOrgId OR (q.organizationId = :parentOrgId AND q.isShared = true)")
    List<CollectionQrCode> findAccessibleQrCodes(
            @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);

    @Query(
            "SELECT q FROM CollectionQrCode q WHERE q.id = :id AND (q.organizationId = :currentOrgId OR (q.organizationId = :parentOrgId AND q.isShared = true))")
    Optional<CollectionQrCode> findAccessibleById(
            @Param("id") UUID id, @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);
}
