package com.billos.api.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.StockMovementDto;
import com.billos.api.entity.*;
import com.billos.api.mapper.InventoryMapper;
import com.billos.api.repository.InventoryLevelRepository;
import com.billos.api.repository.ProductRepository;
import com.billos.api.repository.StockMovementRepository;
import com.billos.api.repository.WarehouseRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class InventoryServiceTest {

    @Mock
    private InventoryLevelRepository inventoryLevelRepository;

    @Mock
    private StockMovementRepository stockMovementRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryMapper inventoryMapper;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @InjectMocks
    private InventoryService inventoryService;

    private UUID warehouseId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
        warehouseId = UUID.randomUUID();
        productId = UUID.randomUUID();
    }

    @Test
    void adjustStock_newProduct_calculatesWacCorrectly() {
        StockMovementDto request = new StockMovementDto();
        request.setWarehouseId(warehouseId);
        request.setProductId(productId);
        request.setMovementType(MovementType.IN);
        request.setQuantity(new BigDecimal("10"));
        request.setUnitCost(new BigDecimal("50.00"));
        request.setReferenceType("PURCHASE_BILL");

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        Product product = new Product();
        product.setId(productId);
        product.setBasePrice(BigDecimal.ZERO);

        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(inventoryLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId))
                .thenReturn(Optional.empty());

        when(inventoryLevelRepository.save(any(InventoryLevel.class))).thenAnswer(i -> i.getArguments()[0]);
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(i -> i.getArguments()[0]);
        when(inventoryMapper.toMovementDto(any(StockMovement.class))).thenReturn(new StockMovementDto());

        inventoryService.adjustStock(request);

        // Verify that product base price (our simple WAC implementation) is updated
        verify(productRepository).save(argThat(p -> p.getBasePrice().compareTo(new BigDecimal("50.00")) == 0));

        // Verify inventory level quantity is set to 10
        verify(inventoryLevelRepository).save(argThat(l -> l.getQuantity().compareTo(new BigDecimal("10")) == 0));
    }

    @Test
    void adjustStock_existingProduct_calculatesWacCorrectly() {
        StockMovementDto request = new StockMovementDto();
        request.setWarehouseId(warehouseId);
        request.setProductId(productId);
        request.setMovementType(MovementType.IN);
        request.setQuantity(new BigDecimal("10"));
        request.setUnitCost(new BigDecimal("150.00")); // New items are more expensive
        request.setReferenceType("PURCHASE_BILL");

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        Product product = new Product();
        product.setId(productId);
        product.setBasePrice(new BigDecimal("100.00")); // Existing WAC is 100

        InventoryLevel existingLevel = new InventoryLevel();
        existingLevel.setQuantity(new BigDecimal("10")); // 10 existing items

        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(inventoryLevelRepository.findByWarehouseIdAndProductId(warehouseId, productId))
                .thenReturn(Optional.of(existingLevel));

        when(inventoryLevelRepository.save(any(InventoryLevel.class))).thenAnswer(i -> i.getArguments()[0]);
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(i -> i.getArguments()[0]);
        when(inventoryMapper.toMovementDto(any(StockMovement.class))).thenReturn(new StockMovementDto());

        inventoryService.adjustStock(request);

        // Calculation: (10 * 100) + (10 * 150) = 1000 + 1500 = 2500 / 20 = 125
        verify(productRepository).save(argThat(p -> p.getBasePrice().compareTo(new BigDecimal("125.00")) == 0));

        // Verify inventory level quantity is set to 20
        verify(inventoryLevelRepository).save(argThat(l -> l.getQuantity().compareTo(new BigDecimal("20")) == 0));
    }
}
