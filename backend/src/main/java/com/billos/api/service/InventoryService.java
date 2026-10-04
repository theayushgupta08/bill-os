package com.billos.api.service;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.StockMovementDto;
import com.billos.api.entity.*;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ResourceNotFoundException;
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
    private final SharedEntityResolver sharedEntityResolver;
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
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        Product product = sharedEntityResolver.accessibleProduct(request.getProductId());

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

        // 2. Apply the movement in the direction its type says. IN adds and OUT removes the (absolute) quantity;
        //    ADJUSTMENT/TRANSFER carry their own sign (e.g. -2 from the manual adjust form).
        BigDecimal delta = signedDelta(request.getMovementType(), request.getQuantity());
        BigDecimal newQuantity = level.getQuantity().add(delta);

        // 3. Weighted average cost, only for valuation transactions (purchases, opening stock, purchase returns).
        //    Cost is per product, so it is averaged over stock in every warehouse — and it goes into costPrice,
        //    never basePrice (the selling price).
        boolean isValuationTransaction = "PURCHASE_BILL".equals(request.getReferenceType())
                || "OPENING_STOCK".equals(request.getReferenceType())
                || "PURCHASE_RETURN".equals(request.getReferenceType());

        //    Only the organization that owns the product maintains its cost: a branch buying a product its parent
        //    shares must not rewrite the parent's row (and its stock, which this average is built from, is the
        //    branch's own).
        boolean ownsProduct = sharedEntityResolver.isOwnedByCurrentOrg(product.getOrganizationId());

        if (request.getMovementType() == MovementType.IN
                && request.getUnitCost() != null
                && isValuationTransaction
                && ownsProduct) {
            BigDecimal stockOnHand = inventoryLevelRepository.findByProductId(product.getId()).stream()
                    .map(InventoryLevel::getQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .max(BigDecimal.ZERO); // negative stock carries no value
            BigDecimal currentCost = product.getCostPrice() != null ? product.getCostPrice() : BigDecimal.ZERO;
            BigDecimal totalValue = stockOnHand.multiply(currentCost).add(delta.multiply(request.getUnitCost()));
            BigDecimal totalQuantity = stockOnHand.add(delta);

            if (totalQuantity.compareTo(BigDecimal.ZERO) > 0) {
                product.setCostPrice(totalValue.divide(totalQuantity, 2, RoundingMode.HALF_UP));
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
        movement.setQuantity(
                request.getMovementType() == MovementType.IN || request.getMovementType() == MovementType.OUT
                        ? request.getQuantity().abs()
                        : request.getQuantity());
        movement.setUnitCost(request.getUnitCost());
        movement.setReason(request.getReason());
        movement.setReferenceType(request.getReferenceType());
        movement.setReferenceId(request.getReferenceId());

        StockMovement savedMovement = stockMovementRepository.save(movement);

        return inventoryMapper.toMovementDto(savedMovement);
    }

    /** The change a movement makes to stock on hand. */
    static BigDecimal signedDelta(MovementType type, BigDecimal quantity) {
        if (quantity == null) {
            throw new BadRequestException("Quantity is required");
        }
        if (type == null) {
            throw new BadRequestException("Movement type is required");
        }
        return switch (type) {
            case IN -> quantity.abs();
            case OUT -> quantity.abs().negate();
            case ADJUSTMENT, TRANSFER -> quantity;
        };
    }
}
