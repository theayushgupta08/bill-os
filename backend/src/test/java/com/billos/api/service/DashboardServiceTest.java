package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.billos.api.dto.DashboardSummaryDto;
import com.billos.api.entity.Customer;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.entity.Supplier;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private PurchaseBillRepository purchaseBillRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @Mock
    private PurchaseBillMapper purchaseBillMapper;

    @Mock
    private CustomerBalanceService customerBalanceService;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private OrganizationClock organizationClock;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
        lenient().when(organizationClock.today(any())).thenReturn(TODAY);
        lenient().when(customerBalanceService.forCurrentOrg()).thenReturn(Customer::getOutstandingBalance);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldTakeEachCustomersBalanceForThisOrg_andIgnoreCreditBalances() {
        Customer owned = customer("100.00");
        Customer sharedByParent = customer("9999.00"); // the parent's figure — must not leak in
        Customer inCredit = customer("-40.00"); // paid an advance: a liability, not negative receivables
        when(customerRepository.findAccessibleCustomers(any(), any()))
                .thenReturn(List.of(owned, sharedByParent, inCredit));
        // What each customer owes this organization: its own ledger, and 25.00 on its own invoices to the shared one
        when(customerBalanceService.forCurrentOrg())
                .thenReturn(c -> c == sharedByParent ? new BigDecimal("25.00") : c.getOutstandingBalance());

        Supplier owed = new Supplier();
        owed.setOutstandingBalance(new BigDecimal("50.00"));
        Supplier overpaid = new Supplier();
        overpaid.setOutstandingBalance(new BigDecimal("-30.00"));
        when(supplierRepository.findAll()).thenReturn(List.of(owed, overpaid));

        DashboardSummaryDto result = dashboardService.getSummary();

        // Matches the receivables/payables reports, which list only positive balances
        assertThat(result.getOutstandingReceivables()).isEqualByComparingTo("125.00");
        assertThat(result.getOutstandingPayables()).isEqualByComparingTo("50.00");
    }

    @Test
    void shouldCountOnlyIssuedDocumentsThisMonth_atTaxableValue() {
        when(salesInvoiceRepository.findAll())
                .thenReturn(List.of(
                        invoice(SalesInvoiceStatus.ISSUED, TODAY.withDayOfMonth(1), "1000.00", "1180.00"),
                        invoice(SalesInvoiceStatus.PARTIAL, TODAY, "500.00", "590.00"),
                        invoice(SalesInvoiceStatus.PAID, TODAY.minusDays(3), "200.00", "236.00"),
                        invoice(SalesInvoiceStatus.DRAFT, TODAY, "7000.00", "8260.00"), // not an invoice yet
                        invoice(SalesInvoiceStatus.VOID, TODAY, "300.00", "354.00"),
                        invoice(
                                SalesInvoiceStatus.ISSUED,
                                TODAY.withDayOfMonth(1).minusDays(1),
                                "900.00",
                                "1062.00"),
                        invoice(SalesInvoiceStatus.ISSUED, TODAY.plusDays(1), "800.00", "944.00"))); // post-dated

        when(purchaseBillRepository.findAll())
                .thenReturn(List.of(
                        bill(PurchaseBillStatus.UNPAID, TODAY, "400.00", "472.00"),
                        bill(PurchaseBillStatus.PAID, TODAY.withDayOfMonth(2), "100.00", "118.00"),
                        bill(PurchaseBillStatus.VOID, TODAY, "999.00", "1178.82"),
                        bill(PurchaseBillStatus.UNPAID, TODAY.minusMonths(1), "250.00", "295.00")));

        DashboardSummaryDto result = dashboardService.getSummary();

        // GST excluded, like the P&L: 1000 + 500 + 200
        assertThat(result.getTotalRevenueMtd()).isEqualByComparingTo("1700.00");
        assertThat(result.getTotalExpensesMtd()).isEqualByComparingTo("500.00");
    }

    @Test
    void shouldUseTheOrganizationsCalendar_forTheMonthBoundary() {
        // Early on the 1st in India the server (UTC) is still in the previous month; the org's calendar decides
        when(organizationClock.today(any())).thenReturn(LocalDate.of(2026, 11, 1));
        when(salesInvoiceRepository.findAll())
                .thenReturn(List.of(
                        invoice(SalesInvoiceStatus.ISSUED, LocalDate.of(2026, 11, 1), "100.00", "118.00"),
                        invoice(SalesInvoiceStatus.ISSUED, LocalDate.of(2026, 10, 31), "900.00", "1062.00")));

        assertThat(dashboardService.getSummary().getTotalRevenueMtd()).isEqualByComparingTo("100.00");
    }

    private static Customer customer(String balance) {
        Customer c = new Customer();
        c.setOutstandingBalance(new BigDecimal(balance));
        return c;
    }

    private static SalesInvoice invoice(SalesInvoiceStatus status, LocalDate date, String subtotal, String total) {
        SalesInvoice i = new SalesInvoice();
        i.setStatus(status);
        i.setInvoiceDate(date);
        i.setSubtotal(new BigDecimal(subtotal));
        i.setTotalAmount(new BigDecimal(total));
        return i;
    }

    private static PurchaseBill bill(PurchaseBillStatus status, LocalDate date, String subtotal, String total) {
        PurchaseBill b = new PurchaseBill();
        b.setStatus(status);
        b.setBillDate(date);
        b.setSubtotal(new BigDecimal(subtotal));
        b.setTotalAmount(new BigDecimal(total));
        return b;
    }
}
