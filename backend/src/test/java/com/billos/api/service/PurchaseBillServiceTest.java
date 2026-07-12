package com.billos.api.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.List;
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
class PurchaseBillServiceTest {

    @Mock
    private PurchaseBillRepository purchaseBillRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private PurchaseBillMapper purchaseBillMapper;

    @InjectMocks
    private PurchaseBillService purchaseBillService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
    }

    @Test
    void createPurchaseBill_updatesInventory() {
        UUID supplierId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();

        PurchaseBillDto requestDto = new PurchaseBillDto();
        requestDto.setSupplierId(supplierId);
        requestDto.setBillNumber("BILL-001");

        PurchaseBillLineDto lineDto = new PurchaseBillLineDto();
        lineDto.setProductId(productId);
        lineDto.setWarehouseId(warehouseId);
        lineDto.setQuantity(new BigDecimal("10"));
        lineDto.setUnitPrice(new BigDecimal("100"));
        requestDto.setLines(List.of(lineDto));

        Customer supplier = new Customer();
        supplier.setId(supplierId);

        Product product = new Product();
        product.setId(productId);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        when(customerRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(purchaseBillRepository.save(any(PurchaseBill.class))).thenAnswer(i -> i.getArguments()[0]);
        when(purchaseBillMapper.toDto(any(PurchaseBill.class))).thenReturn(new PurchaseBillDto());

        purchaseBillService.createPurchaseBill(requestDto);

        // Verify InventoryService.adjustStock is called correctly
        verify(inventoryService)
                .adjustStock(argThat(movement -> movement.getProductId().equals(productId)
                        && movement.getWarehouseId().equals(warehouseId)
                        && movement.getQuantity().compareTo(new BigDecimal("10")) == 0
                        && movement.getMovementType() == MovementType.IN));
    }
}
