package com.billos.api.repository;

import com.billos.api.entity.JournalEntryLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, UUID> {
}
