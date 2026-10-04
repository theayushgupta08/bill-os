package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.mapper.SalesInvoiceMapper;
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
    private OrganizationRepository organizationRepository;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @Mock
    private TaxRateRepository taxRateRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

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
        requestDto.setStatus(SalesInvoiceStatus.ISSUED);

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

        Organization org = new Organization();
        org.setId(UUID.fromString(TenantContext.getCurrentTenant()));

        when(organizationRepository.findById(any())).thenReturn(Optional.of(org));
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE))
                .thenReturn("INV-0001");
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        salesInvoiceService.createSalesInvoice(requestDto);

        // Verify InventoryService.adjustStock is called correctly for an OUT movement
        verify(inventoryService)
                .adjustStock(argThat(movement -> movement.getProductId().equals(productId)
                        && movement.getWarehouseId().equals(warehouseId)
                        && movement.getQuantity().compareTo(new BigDecimal("5")) == 0
                        && movement.getMovementType() == MovementType.OUT));
    }

    @Test
    void createSalesInvoice_asIssued_addsTotalToCustomerBalance() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        Customer customer = new Customer();
        customer.setOutstandingBalance(new BigDecimal("100.00"));

        stubLineLookups(customer, customerId, productId, warehouseId);
        when(sharedEntityResolver.isOwnedByCurrentOrg(any())).thenReturn(true);
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        salesInvoiceService.createSalesInvoice(request(customerId, productId, warehouseId, SalesInvoiceStatus.ISSUED));

        // 5 x 200 = 1000 added on top of the existing 100
        assertThat(customer.getOutstandingBalance()).isEqualByComparingTo("1100.00");
        verify(customerRepository).save(customer);
    }

    @Test
    void createSalesInvoice_asIssued_toSharedCustomer_leavesOwnersBalanceAlone() {
        // Regression: a branch invoicing a customer its parent shares added the amount to the parent's single
        // balance column, so the parent and every sibling branch saw the branch's receivables.
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID parentOrg = UUID.randomUUID();
        Customer shared = new Customer();
        shared.setOrganizationId(parentOrg);
        shared.setOutstandingBalance(new BigDecimal("100.00"));

        stubLineLookups(shared, customerId, productId, warehouseId);
        when(sharedEntityResolver.isOwnedByCurrentOrg(parentOrg)).thenReturn(false);
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        salesInvoiceService.createSalesInvoice(request(customerId, productId, warehouseId, SalesInvoiceStatus.ISSUED));

        assertThat(shared.getOutstandingBalance()).isEqualByComparingTo("100.00");
        verify(customerRepository, never()).save(any());
    }

    @Test
    void createSalesInvoice_asDraft_doesNotTouchStockOrBalance() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        Customer customer = new Customer();

        stubLineLookups(customer, customerId, productId, warehouseId);
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        salesInvoiceService.createSalesInvoice(request(customerId, productId, warehouseId, SalesInvoiceStatus.DRAFT));

        verifyNoInteractions(inventoryService);
        assertThat(customer.getOutstandingBalance()).isEqualByComparingTo("0");
    }

    @Test
    void createSalesInvoice_rejectsClientSuppliedPaidStatus() {
        UUID customerId = UUID.randomUUID();
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(new Customer());
        when(organizationRepository.findById(any())).thenReturn(Optional.of(new Organization()));

        assertThatThrownBy(() -> salesInvoiceService.createSalesInvoice(
                        request(customerId, UUID.randomUUID(), UUID.randomUUID(), SalesInvoiceStatus.PAID)))
                .hasMessageContaining("only be DRAFT or ISSUED");
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void createSalesInvoice_rejectsCancelledSalesOrder() {
        UUID customerId = UUID.randomUUID();
        UUID soId = UUID.randomUUID();
        SalesOrder so = new SalesOrder();
        so.setStatus(SalesOrderStatus.CANCELLED);
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(new Customer());
        when(organizationRepository.findById(any())).thenReturn(Optional.of(new Organization()));
        when(salesOrderRepository.findById(soId)).thenReturn(Optional.of(so));

        SalesInvoiceDto dto = request(customerId, UUID.randomUUID(), UUID.randomUUID(), SalesInvoiceStatus.DRAFT);
        dto.setSoId(soId);

        assertThatThrownBy(() -> salesInvoiceService.createSalesInvoice(dto)).hasMessageContaining("CANCELLED");
        assertThat(so.getStatus()).isEqualTo(SalesOrderStatus.CANCELLED);
    }

    @Test
    void createSalesInvoice_roundsTaxToPaise_andSplitsCgstSgstExactly() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID taxRateId = UUID.randomUUID();
        TaxRate fivePercent = new TaxRate();
        fivePercent.setRate(new BigDecimal("5"));

        stubLineLookups(new Customer(), customerId, productId, warehouseId);
        when(taxRateRepository.findById(taxRateId)).thenReturn(Optional.of(fivePercent));
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());

        SalesInvoiceDto dto = request(customerId, productId, warehouseId, SalesInvoiceStatus.DRAFT);
        dto.getLines().get(0).setQuantity(new BigDecimal("1"));
        dto.getLines().get(0).setUnitPrice(new BigDecimal("10.10"));
        dto.getLines().get(0).setTaxRateId(taxRateId);

        salesInvoiceService.createSalesInvoice(dto);

        org.mockito.ArgumentCaptor<SalesInvoice> saved = org.mockito.ArgumentCaptor.forClass(SalesInvoice.class);
        verify(salesInvoiceRepository).save(saved.capture());
        SalesInvoiceLine line = saved.getValue().getLines().get(0);
        // 5% of 10.10 = 0.505 -> 0.51; intra-state split 0.26 + 0.25 must sum back to 0.51
        assertThat(line.getTaxAmount()).isEqualByComparingTo("0.51");
        assertThat(line.getCgstAmount().add(line.getSgstAmount())).isEqualByComparingTo("0.51");
        assertThat(saved.getValue().getTotalAmount()).isEqualByComparingTo("10.61");
    }

    private SalesInvoiceDto request(UUID customerId, UUID productId, UUID warehouseId, SalesInvoiceStatus status) {
        SalesInvoiceDto dto = new SalesInvoiceDto();
        dto.setCustomerId(customerId);
        dto.setStatus(status);
        SalesInvoiceLineDto lineDto = new SalesInvoiceLineDto();
        lineDto.setProductId(productId);
        lineDto.setWarehouseId(warehouseId);
        lineDto.setQuantity(new BigDecimal("5"));
        lineDto.setUnitPrice(new BigDecimal("200"));
        dto.setLines(new java.util.ArrayList<>(List.of(lineDto)));
        return dto;
    }

    private void stubLineLookups(Customer customer, UUID customerId, UUID productId, UUID warehouseId) {
        Product product = new Product();
        product.setId(productId);
        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        when(organizationRepository.findById(any())).thenReturn(Optional.of(new Organization()));
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE))
                .thenReturn("INV-0001");
    }
}
