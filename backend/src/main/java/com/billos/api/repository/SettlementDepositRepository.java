package com.billos.api.repository;

import com.billos.api.entity.SettlementDeposit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettlementDepositRepository extends JpaRepository<SettlementDeposit, UUID> {
    List<SettlementDeposit> findByUserId(UUID userId);
}
