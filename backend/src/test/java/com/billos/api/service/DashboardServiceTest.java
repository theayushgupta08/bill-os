package com.billos.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.billos.api.dto.DashboardSummaryDto;
import com.billos.api.entity.Customer;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.entity.Supplier;
import com.billos.api.mapper.ProductMapper;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.ProductRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private PurchaseBillRepository purchaseBillRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @Mock
    private PurchaseBillMapper purchaseBillMapper;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private DashboardService dashboardService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        com.billos.api.tenant.TenantContext.setCurrentTenant(
                java.util.UUID.randomUUID().toString());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.billos.api.tenant.TenantContext.clear();
    }

    @Test
    void testGetSummary() {
        Customer c1 = new Customer();
        c1.setOutstandingBalance(new BigDecimal("100.00"));
        when(customerRepository.findByOrganizationId(any())).thenReturn(List.of(c1));

        Supplier s1 = new Supplier();
        s1.setOutstandingBalance(new BigDecimal("50.00"));
        when(supplierRepository.findAll()).thenReturn(List.of(s1));

        SalesInvoice i1 = new SalesInvoice();
        i1.setTotalAmount(new BigDecimal("200.00"));
        i1.setStatus(SalesInvoiceStatus.DRAFT);
        i1.setInvoiceDate(LocalDate.now());

        when(salesInvoiceRepository.findAll()).thenReturn(List.of(i1));

        PurchaseBill pb1 = new PurchaseBill();
        pb1.setTotalAmount(new BigDecimal("80.00"));
        pb1.setStatus(PurchaseBillStatus.UNPAID);
        pb1.setBillDate(LocalDate.now());

        when(purchaseBillRepository.findAll()).thenReturn(List.of(pb1));

        DashboardSummaryDto result = dashboardService.getSummary();

        assertNotNull(result);
        assertEquals(new BigDecimal("100.00"), result.getOutstandingReceivables());
        assertEquals(new BigDecimal("50.00"), result.getOutstandingPayables());
        assertEquals(new BigDecimal("200.00"), result.getTotalRevenueMtd());
        assertEquals(new BigDecimal("80.00"), result.getTotalExpensesMtd());
    }
}
