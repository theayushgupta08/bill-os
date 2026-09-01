package com.billos.api.repository;

import com.billos.api.entity.CollectionLedger;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionLedgerRepository extends JpaRepository<CollectionLedger, UUID> {
    List<CollectionLedger> findByUserId(UUID userId);
}
