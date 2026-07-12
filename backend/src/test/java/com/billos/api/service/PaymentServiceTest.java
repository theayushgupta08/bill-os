package com.billos.api.service;

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

    @InjectMocks
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
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
}
