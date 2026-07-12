package com.billos.api.repository;

import com.billos.api.entity.PurchaseBill;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseBillRepository extends JpaRepository<PurchaseBill, UUID> {
    List<PurchaseBill> findTop5ByOrderByCreatedAtDesc();
}
