package com.billos.api.service;

import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesInvoiceServiceTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private InventoryService inventoryService;
    @Mock
    private SequenceGeneratorService sequenceGeneratorService;
    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @InjectMocks
    private SalesInvoiceService salesInvoiceService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
    }

    @Test
    void createSalesInvoice_updatesInventory_OUT() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();

        SalesInvoiceDto requestDto = new SalesInvoiceDto();
        requestDto.setCustomerId(customerId);

        SalesInvoiceLineDto lineDto = new SalesInvoiceLineDto();
        lineDto.setProductId(productId);
        lineDto.setWarehouseId(warehouseId);
        lineDto.setQuantity(new BigDecimal("5"));
        lineDto.setUnitPrice(new BigDecimal("200"));
        requestDto.setLines(List.of(lineDto));

        Customer customer = new Customer();
        customer.setId(customerId);

        Product product = new Product();
        product.setId(productId);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE)).thenReturn("INV-0001");
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        salesInvoiceService.createSalesInvoice(requestDto);

        // Verify InventoryService.adjustStock is called correctly for an OUT movement
        verify(inventoryService).adjustStock(argThat(movement -> 
            movement.getProductId().equals(productId) &&
            movement.getWarehouseId().equals(warehouseId) &&
            movement.getQuantity().compareTo(new BigDecimal("5")) == 0 &&
            movement.getMovementType() == MovementType.OUT
        ));
    }
}
