package com.billos.api.repository;

import com.billos.api.entity.InventoryLevel;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryLevelRepository extends JpaRepository<InventoryLevel, UUID> {
    Optional<InventoryLevel> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId);

    List<InventoryLevel> findByWarehouseId(UUID warehouseId);

    List<InventoryLevel> findByProductId(UUID productId);
}
