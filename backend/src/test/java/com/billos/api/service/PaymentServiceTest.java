package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.PaymentAllocationDto;
import com.billos.api.dto.PaymentDto;
import com.billos.api.entity.*;
import com.billos.api.mapper.PaymentMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PaymentRepository;
import com.billos.api.repository.SalesInvoiceRepository;
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
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SequenceGeneratorService sequenceGeneratorService;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
        // Customers in these tests belong to the current organization unless a test says otherwise
        lenient().when(sharedEntityResolver.isOwnedByCurrentOrg(any())).thenReturn(true);
    }

    @Test
    void recordReceipt_forSharedCustomer_leavesOwnersBalanceAlone() {
        // Regression: a branch's receipt against a customer its parent shares reduced the parent's balance column
        UUID invoiceId = UUID.randomUUID();
        UUID parentOrg = UUID.randomUUID();
        Customer shared = new Customer();
        shared.setOrganizationId(parentOrg);
        shared.setOutstandingBalance(new BigDecimal("500"));
        SalesInvoice invoice = new SalesInvoice();
        invoice.setId(invoiceId);
        invoice.setCustomer(shared);
        invoice.setTotalAmount(new BigDecimal("100"));
        invoice.setStatus(SalesInvoiceStatus.ISSUED);
        PaymentDto requestDto = new PaymentDto();
        requestDto.setAmount(new BigDecimal("100"));
        PaymentAllocationDto alloc = new PaymentAllocationDto();
        alloc.setSalesInvoiceId(invoiceId);
        alloc.setAllocatedAmount(new BigDecimal("100"));
        requestDto.setAllocations(List.of(alloc));

        when(sharedEntityResolver.isOwnedByCurrentOrg(parentOrg)).thenReturn(false);
        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.PAYMENT_RECEIPT))
                .thenReturn("REC-002");
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);
        when(paymentMapper.toDto(any(Payment.class))).thenReturn(new PaymentDto());

        paymentService.recordReceipt(requestDto);

        assertEquals(SalesInvoiceStatus.PAID, invoice.getStatus()); // the branch's own invoice is still settled
        assertEquals(new BigDecimal("500"), shared.getOutstandingBalance());
        verify(customerRepository, never()).save(any());
    }

    @Test
    void recordReceipt_updatesInvoiceToPaid() {
        UUID invoiceId = UUID.randomUUID();

        Customer customer = new Customer();
        customer.setOutstandingBalance(new BigDecimal("500"));

        SalesInvoice invoice = new SalesInvoice();
        invoice.setId(invoiceId);
        invoice.setCustomer(customer);
        invoice.setTotalAmount(new BigDecimal("100"));
        invoice.setStatus(SalesInvoiceStatus.ISSUED);

        PaymentDto requestDto = new PaymentDto();
        requestDto.setAmount(new BigDecimal("100"));

        PaymentAllocationDto alloc = new PaymentAllocationDto();
        alloc.setSalesInvoiceId(invoiceId);
        alloc.setAllocatedAmount(new BigDecimal("100"));
        requestDto.setAllocations(List.of(alloc));

        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.PAYMENT_RECEIPT))
                .thenReturn("REC-001");
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);
        when(paymentMapper.toDto(any(Payment.class))).thenReturn(new PaymentDto());

        paymentService.recordReceipt(requestDto);

        // Verify Invoice Status updated
        assertEquals(SalesInvoiceStatus.PAID, invoice.getStatus());
        verify(salesInvoiceRepository).save(invoice);

        // Verify Customer balance updated
        assertEquals(new BigDecimal("400"), customer.getOutstandingBalance());
        verify(customerRepository).save(customer);
    }

    private SalesInvoice issuedInvoice(UUID id, String total, Customer customer) {
        SalesInvoice invoice = new SalesInvoice();
        invoice.setId(id);
        invoice.setCustomer(customer);
        invoice.setTotalAmount(new BigDecimal(total));
        invoice.setStatus(SalesInvoiceStatus.ISSUED);
        return invoice;
    }

    private PaymentDto receipt(UUID invoiceId, String amount) {
        PaymentDto dto = new PaymentDto();
        dto.setAmount(new BigDecimal(amount));
        PaymentAllocationDto alloc = new PaymentAllocationDto();
        alloc.setSalesInvoiceId(invoiceId);
        alloc.setAllocatedAmount(new BigDecimal(amount));
        dto.setAllocations(List.of(alloc));
        return dto;
    }

    @Test
    void recordReceipt_accumulatesPartialPayments_untilInvoiceIsPaid() {
        UUID invoiceId = UUID.randomUUID();
        Customer customer = new Customer();
        customer.setOutstandingBalance(new BigDecimal("100"));
        SalesInvoice invoice = issuedInvoice(invoiceId, "100", customer);

        when(sequenceGeneratorService.getNextDocumentNumber(DocumentType.PAYMENT_RECEIPT))
                .thenReturn("REC-001");
        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArguments()[0]);
        when(paymentMapper.toDto(any(Payment.class))).thenReturn(new PaymentDto());

        paymentService.recordReceipt(receipt(invoiceId, "40"));
        assertEquals(SalesInvoiceStatus.PARTIAL, invoice.getStatus());
        assertEquals(0, new BigDecimal("40").compareTo(invoice.getAmountPaid()));

        paymentService.recordReceipt(receipt(invoiceId, "60"));
        assertEquals(SalesInvoiceStatus.PAID, invoice.getStatus());
        assertEquals(0, new BigDecimal("100").compareTo(invoice.getAmountPaid()));
        assertEquals(0, BigDecimal.ZERO.compareTo(customer.getOutstandingBalance()));
    }

    @Test
    void recordReceipt_rejectsAllocationAboveRemainingBalance() {
        UUID invoiceId = UUID.randomUUID();
        SalesInvoice invoice = issuedInvoice(invoiceId, "100", new Customer());
        invoice.setAmountPaid(new BigDecimal("70"));
        invoice.setStatus(SalesInvoiceStatus.PARTIAL);

        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> paymentService.recordReceipt(receipt(invoiceId, "50")))
                .hasMessageContaining("exceeds the balance due");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordReceipt_rejectsPaymentAgainstDraftInvoice() {
        UUID invoiceId = UUID.randomUUID();
        SalesInvoice invoice = issuedInvoice(invoiceId, "100", new Customer());
        invoice.setStatus(SalesInvoiceStatus.DRAFT);

        when(salesInvoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        assertThatThrownBy(() -> paymentService.recordReceipt(receipt(invoiceId, "100")))
                .hasMessageContaining("DRAFT");
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordReceipt_rejectsAllocationsAbovePaymentAmount() {
        UUID invoiceId = UUID.randomUUID();
        PaymentDto dto = receipt(invoiceId, "100");
        dto.setAmount(new BigDecimal("50"));

        assertThatThrownBy(() -> paymentService.recordReceipt(dto)).hasMessageContaining("exceeds payment amount");
        verifyNoInteractions(salesInvoiceRepository, paymentRepository);
    }
}
