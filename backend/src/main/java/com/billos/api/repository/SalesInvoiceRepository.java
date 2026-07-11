package com.billos.api.repository;

import com.billos.api.entity.SalesInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, UUID> {
    List<SalesInvoice> findTop5ByOrderByCreatedAtDesc();
}
