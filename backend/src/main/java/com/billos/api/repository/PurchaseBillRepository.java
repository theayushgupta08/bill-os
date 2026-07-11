package com.billos.api.repository;

import com.billos.api.entity.PurchaseBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface PurchaseBillRepository extends JpaRepository<PurchaseBill, UUID> {
    List<PurchaseBill> findTop5ByOrderByCreatedAtDesc();
}
