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

    @Test
    void createSalesInvoice_rejectsNegativeQuantity_beforeAnyStockMoves() {
        // Regression: -5 shrank the invoice total while the OUT movement still deducted 5 from stock
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        stubLineLookups(new Customer(), customerId, productId, warehouseId);
        SalesInvoiceDto dto = request(customerId, productId, warehouseId, SalesInvoiceStatus.ISSUED);
        dto.getLines().get(0).setQuantity(new BigDecimal("-5"));

        assertThatThrownBy(() -> salesInvoiceService.createSalesInvoice(dto))
                .isInstanceOf(com.billos.api.exception.BadRequestException.class)
                .hasMessageContaining("quantity greater than zero");
        verifyNoInteractions(inventoryService);
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void createSalesInvoice_rejectsNegativeUnitPrice() {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        stubLineLookups(new Customer(), customerId, productId, warehouseId);
        SalesInvoiceDto dto = request(customerId, productId, warehouseId, SalesInvoiceStatus.DRAFT);
        dto.getLines().get(0).setUnitPrice(new BigDecimal("-200"));

        assertThatThrownBy(() -> salesInvoiceService.createSalesInvoice(dto)).hasMessageContaining("can't be negative");
    }

    @Test
    void createSalesInvoice_storesQuantityAndRateAtTwoDecimals_soTheLineReconciles() {
        // The columns hold 2 dp: computing on 10.005 but storing 10.01 left qty x rate different from the line's
        // taxable value
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        stubLineLookups(new Customer(), customerId, productId, warehouseId);
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());
        SalesInvoiceDto dto = request(customerId, productId, warehouseId, SalesInvoiceStatus.DRAFT);
        dto.getLines().get(0).setQuantity(new BigDecimal("3"));
        dto.getLines().get(0).setUnitPrice(new BigDecimal("10.005"));

        salesInvoiceService.createSalesInvoice(dto);

        org.mockito.ArgumentCaptor<SalesInvoice> saved = org.mockito.ArgumentCaptor.forClass(SalesInvoice.class);
        verify(salesInvoiceRepository).save(saved.capture());
        SalesInvoiceLine line = saved.getValue().getLines().get(0);
        assertThat(line.getUnitPrice()).isEqualByComparingTo("10.01");
        assertThat(saved.getValue().getSubtotal())
                .isEqualByComparingTo(line.getQuantity().multiply(line.getUnitPrice()))
                .isEqualByComparingTo("30.03");
    }

    @Test
    void createSalesInvoice_treatsStateAbbreviationAsTheSameState_soChargesCgstAndSgst() {
        // Regression: "Maharashtra" vs "MH" compared as different strings and charged IGST on an intra-state sale
        SalesInvoiceLine line = issueTaxedLineTo(org("Maharashtra", null), customer("MH", null));

        assertThat(line.getCgstAmount()).isEqualByComparingTo("90.00");
        assertThat(line.getSgstAmount()).isEqualByComparingTo("90.00");
        assertThat(line.getIgstAmount()).isEqualByComparingTo("0");
    }

    @Test
    void createSalesInvoice_chargesIgst_whenTheCustomersGstinIsInAnotherState() {
        // No billing state typed in, but the GSTIN says Karnataka (29) while the seller is in Maharashtra
        SalesInvoiceLine line = issueTaxedLineTo(org("Maharashtra", null), customer(null, "29ABCDE1234F1Z5"));

        assertThat(line.getIgstAmount()).isEqualByComparingTo("180.00");
        assertThat(line.getCgstAmount()).isEqualByComparingTo("0");
        assertThat(line.getSgstAmount()).isEqualByComparingTo("0");
    }

    @Test
    void generateEInvoiceJson_usesStateCodes_roundedItemAmounts_andSerialNumbers() {
        UUID invoiceId = UUID.randomUUID();
        Product product = new Product();
        product.setName("Widget");
        SalesInvoiceLine line = new SalesInvoiceLine();
        line.setId(UUID.randomUUID());
        line.setProduct(product);
        line.setQuantity(new BigDecimal("1.25"));
        line.setUnitPrice(new BigDecimal("3.33"));
        line.setLineTotal(new BigDecimal("4.16"));
        SalesInvoice invoice = new SalesInvoice();
        invoice.setInvoiceNumber("INV-0001");
        invoice.setInvoiceDate(java.time.LocalDate.of(2026, 10, 4));
        invoice.setOrganizationId(UUID.randomUUID());
        invoice.setCustomer(customer("Karnataka", null));
        invoice.setSubtotal(new BigDecimal("4.16"));
        invoice.setTotalAmount(new BigDecimal("4.16"));
        invoice.addLine(line);
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(organizationRepository.findById(invoice.getOrganizationId()))
                .thenReturn(Optional.of(org(null, "27AAAAA0000A1Z5")));

        java.util.Map<String, Object> json = salesInvoiceService.generateEInvoiceJson(invoiceId);

        assertThat(((java.util.Map<?, ?>) json.get("SellerDtls")).get("Stcd")).isEqualTo("27");
        assertThat(((java.util.Map<?, ?>) json.get("BuyerDtls")).get("Stcd")).isEqualTo("29");
        java.util.Map<?, ?> item = (java.util.Map<?, ?>) ((List<?>) json.get("ItemList")).get(0);
        assertThat(item.get("SlNo")).isEqualTo("1");
        // 1.25 x 3.33 = 4.1625, the taxable value is 4.16
        assertThat((BigDecimal) item.get("TotAmt")).isEqualByComparingTo("4.16");
    }

    /** Creates a one-line 18% invoice (5 x 200) from {@code seller} to {@code customer}; returns the saved line. */
    private SalesInvoiceLine issueTaxedLineTo(Organization seller, Customer customer) {
        UUID customerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID warehouseId = UUID.randomUUID();
        UUID taxRateId = UUID.randomUUID();
        TaxRate gst18 = new TaxRate();
        gst18.setRate(new BigDecimal("18"));
        stubLineLookups(seller, customer, customerId, productId, warehouseId);
        when(taxRateRepository.findById(taxRateId)).thenReturn(Optional.of(gst18));
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(i -> i.getArguments()[0]);
        when(salesInvoiceMapper.toDto(any(SalesInvoice.class))).thenReturn(new SalesInvoiceDto());
        SalesInvoiceDto dto = request(customerId, productId, warehouseId, SalesInvoiceStatus.DRAFT);
        dto.getLines().get(0).setTaxRateId(taxRateId);

        salesInvoiceService.createSalesInvoice(dto);

        org.mockito.ArgumentCaptor<SalesInvoice> saved = org.mockito.ArgumentCaptor.forClass(SalesInvoice.class);
        verify(salesInvoiceRepository).save(saved.capture());
        return saved.getValue().getLines().get(0);
    }

    private static Organization org(String state, String gstin) {
        Organization org = new Organization();
        org.setState(state);
        org.setGstin(gstin);
        return org;
    }

    private static Customer customer(String billingState, String gstin) {
        Customer customer = new Customer();
        customer.setName("Acme");
        customer.setBillingState(billingState);
        customer.setGstin(gstin);
        return customer;
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
        stubLineLookups(new Organization(), customer, customerId, productId, warehouseId);
    }

    private void stubLineLookups(
            Organization org, Customer customer, UUID customerId, UUID productId, UUID warehouseId) {
        Product product = new Product();
        product.setId(productId);
        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        when(organizationRepository.findById(any())).thenReturn(Optional.of(org));
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.accessibleProduct(productId)).thenReturn(product);
        when(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse));
        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE))
                .thenReturn("INV-0001");
    }
}
