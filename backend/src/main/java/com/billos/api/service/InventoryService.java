package com.billos.api.service;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.StockMovementDto;
import com.billos.api.entity.*;
import com.billos.api.mapper.InventoryMapper;
import com.billos.api.repository.InventoryLevelRepository;
import com.billos.api.repository.ProductRepository;
import com.billos.api.repository.StockMovementRepository;
import com.billos.api.repository.WarehouseRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class InventoryService {

    private final InventoryLevelRepository inventoryLevelRepository;
    private final StockMovementRepository stockMovementRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryMapper inventoryMapper;

    @Transactional(readOnly = true)
    public List<InventoryLevelDto> getAllInventoryLevels() {
        return inventoryLevelRepository.findAll().stream()
                .map(inventoryMapper::toLevelDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMovementDto> getProductMovements(UUID productId) {
        return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(inventoryMapper::toMovementDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public StockMovementDto adjustStock(StockMovementDto request) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Warehouse warehouse = warehouseRepository
                .findById(request.getWarehouseId())
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // 1. Get or create InventoryLevel
        InventoryLevel level = inventoryLevelRepository
                .findByWarehouseIdAndProductId(warehouse.getId(), product.getId())
                .orElseGet(() -> {
                    InventoryLevel newLevel = new InventoryLevel();
                    newLevel.setOrganizationId(orgId);
                    newLevel.setWarehouse(warehouse);
                    newLevel.setProduct(product);
                    newLevel.setQuantity(BigDecimal.ZERO);
                    return newLevel;
                });

        // 2. Update Quantity (Request quantity is the relative change)
        BigDecimal newQuantity = level.getQuantity().add(request.getQuantity());

        // 3. WAC (Weighted Average Cost) Calculation Logic (only applicable for IN movements like Purchases)
        if (request.getMovementType() == MovementType.IN && request.getUnitCost() != null) {
            BigDecimal currentTotalValue = level.getQuantity()
                    .multiply(product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.ZERO);
            BigDecimal newIncomingValue = request.getQuantity().multiply(request.getUnitCost());

            BigDecimal totalValue = currentTotalValue.add(newIncomingValue);

            if (newQuantity.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal newWac = totalValue.divide(newQuantity, 2, RoundingMode.HALF_UP);
                // In a full system, you might store WAC on the InventoryLevel or Product
                // For now, we update the product base price as the WAC for simplicity
                product.setBasePrice(newWac);
                productRepository.save(product);
            }
        }

        level.setQuantity(newQuantity);
        inventoryLevelRepository.save(level);

        // 4. Record Stock Movement
        StockMovement movement = new StockMovement();
        movement.setOrganizationId(orgId);
        movement.setWarehouse(warehouse);
        movement.setProduct(product);
        movement.setMovementType(request.getMovementType());
        movement.setQuantity(request.getQuantity());
        movement.setUnitCost(request.getUnitCost());
        movement.setReason(request.getReason());
        movement.setReferenceType(request.getReferenceType());
        movement.setReferenceId(request.getReferenceId());

        StockMovement savedMovement = stockMovementRepository.save(movement);

        return inventoryMapper.toMovementDto(savedMovement);
    }
}
