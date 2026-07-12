package com.billos.api.repository;

import com.billos.api.entity.DocumentType;
import com.billos.api.entity.NumberingSequence;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NumberingSequenceRepository extends JpaRepository<NumberingSequence, UUID> {
    Optional<NumberingSequence> findByOrganizationIdAndDocumentType(UUID organizationId, DocumentType documentType);
}
