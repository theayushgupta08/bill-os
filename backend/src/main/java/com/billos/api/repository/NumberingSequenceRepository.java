package com.billos.api.repository;

import com.billos.api.entity.DocumentType;
import com.billos.api.entity.NumberingSequence;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NumberingSequenceRepository extends JpaRepository<NumberingSequence, UUID> {
    Optional<NumberingSequence> findByOrganizationIdAndDocumentType(UUID organizationId, DocumentType documentType);

    /**
     * Same lookup with a row lock (SELECT ... FOR UPDATE) held until the transaction ends, so two documents created
     * at the same moment can't both read the same next number.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "SELECT s FROM NumberingSequence s WHERE s.organizationId = :organizationId AND s.documentType = :documentType")
    Optional<NumberingSequence> findForUpdate(
            @Param("organizationId") UUID organizationId, @Param("documentType") DocumentType documentType);
}
