package com.billos.api.repository;

import com.billos.api.entity.StockMovement;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(UUID productId);

    List<StockMovement> findByWarehouseIdAndProductIdOrderByCreatedAtDesc(UUID warehouseId, UUID productId);
}
