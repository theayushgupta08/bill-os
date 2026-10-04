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
    private SupplierRepository supplierRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private TaxRateRepository taxRateRepository;

    @Mock
    private PurchaseBillMapper purchaseBillMapper;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

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

        Supplier supplier = new Supplier();
        supplier.setId(supplierId);

        Product product = new Product();
        product.setId(productId);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        Organization org = new Organization();
        org.setId(UUID.fromString(TenantContext.getCurrentTenant()));

        when(organizationRepository.findById(any())).thenReturn(Optional.of(org));
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
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

    @Test
    void createPurchaseBill_rejectsAlreadyBilledPurchaseOrder() {
        UUID supplierId = UUID.randomUUID();
        UUID poId = UUID.randomUUID();
        Supplier supplier = new Supplier();
        supplier.setId(supplierId);
        PurchaseOrder po = new PurchaseOrder();
        po.setStatus(PurchaseOrderStatus.BILLED);
        po.setSupplier(supplier);

        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(organizationRepository.findById(any())).thenReturn(Optional.of(new Organization()));
        when(purchaseOrderRepository.findById(poId)).thenReturn(Optional.of(po));

        PurchaseBillDto dto = new PurchaseBillDto();
        dto.setSupplierId(supplierId);
        dto.setPoId(poId);
        PurchaseBillLineDto line = new PurchaseBillLineDto();
        line.setQuantity(BigDecimal.ONE);
        line.setUnitPrice(BigDecimal.TEN);
        dto.setLines(List.of(line));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> purchaseBillService.createPurchaseBill(dto))
                .isInstanceOf(com.billos.api.exception.ConflictException.class)
                .hasMessageContaining("BILLED");
        verify(purchaseBillRepository, never()).save(any());
    }

    @Test
    void createPurchaseBill_rejectsZeroQuantity_beforeStockOrPayablesMove() {
        UUID supplierId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        PurchaseBillDto requestDto = new PurchaseBillDto();
        requestDto.setSupplierId(supplierId);
        PurchaseBillLineDto lineDto = new PurchaseBillLineDto();
        lineDto.setProductId(productId);
        lineDto.setWarehouseId(warehouseId);
        lineDto.setQuantity(BigDecimal.ZERO);
        lineDto.setUnitPrice(new BigDecimal("100"));
        requestDto.setLines(List.of(lineDto));
        Supplier supplier = new Supplier();
        supplier.setId(supplierId);
        Product product = new Product();
        product.setId(productId);
        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        when(organizationRepository.findById(any())).thenReturn(Optional.of(new Organization()));
        when(supplierRepository.findById(supplierId)).thenReturn(Optional.of(supplier));
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> purchaseBillService.createPurchaseBill(requestDto))
                .isInstanceOf(com.billos.api.exception.BadRequestException.class)
                .hasMessageContaining("quantity greater than zero");
        org.mockito.Mockito.verifyNoInteractions(inventoryService);
        org.assertj.core.api.Assertions.assertThat(supplier.getOutstandingBalance())
                .isEqualByComparingTo("0");
    }

    @Test
    void createPurchaseBill_rejectsABillWithoutLines() {
        PurchaseBillDto requestDto = new PurchaseBillDto();
        requestDto.setSupplierId(UUID.randomUUID());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> purchaseBillService.createPurchaseBill(requestDto))
                .hasMessageContaining("at least one line");
        org.mockito.Mockito.verifyNoInteractions(inventoryService, supplierRepository);
    }
}
