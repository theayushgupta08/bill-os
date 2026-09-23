package com.billos.api.repository;

import com.billos.api.entity.JournalEntryLine;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, UUID> {
    /** Lines are reached only through their (tenant-scoped) entry; the account id itself is org-specific. */
    boolean existsByAccount_Id(UUID accountId);
}
