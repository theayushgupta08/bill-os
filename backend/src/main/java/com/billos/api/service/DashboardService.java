package com.billos.api.service;

import com.billos.api.dto.DashboardSummaryDto;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class DashboardService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final PurchaseBillRepository purchaseBillRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerBalanceService customerBalanceService;
    private final OrganizationService organizationService;
    private final OrganizationClock organizationClock;

    private final SalesInvoiceMapper salesInvoiceMapper;
    private final PurchaseBillMapper purchaseBillMapper;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // 1. Outstanding Receivables & Payables — the same figures the receivables/payables reports total: what is
        // owed, so a customer's advance or a supplier we overpaid doesn't net it down
        // Customer has no @TenantId (branch sharing), so list the ones this org can see and take what each owes
        // this org (its own ledger for customers it owns, its own invoices for customers its parent shares)
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        var balance = customerBalanceService.forCurrentOrg();
        BigDecimal totalReceivables =
                customerRepository
                        .findAccessibleCustomers(orgId, organizationService.resolvePrimaryOrgId(orgId))
                        .stream()
                        .map(balance)
                        .filter(owed -> owed.signum() > 0)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setOutstandingReceivables(totalReceivables);

        BigDecimal totalPayables = supplierRepository.findAll().stream()
                .map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO)
                .filter(owed -> owed.signum() > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setOutstandingPayables(totalPayables);

        // 2. MTD revenue & purchases, measured like the P&L: issued invoices and bills only (no drafts or voids),
        // on taxable value (GST is collected/paid for the government, not income/cost), from the 1st of the
        // organization's current month up to today (a document dated later isn't "to date")
        LocalDate today = organizationClock.today(orgId);
        LocalDate startOfMonth = today.withDayOfMonth(1);

        BigDecimal mtdRevenue = salesInvoiceRepository.findAll().stream()
                .filter(ReportService::isReportableInvoice)
                .filter(inv -> inv.getInvoiceDate() != null
                        && !inv.getInvoiceDate().isBefore(startOfMonth)
                        && !inv.getInvoiceDate().isAfter(today))
                .map(inv -> inv.getSubtotal() != null ? inv.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalRevenueMtd(mtdRevenue);

        BigDecimal mtdExpenses = purchaseBillRepository.findAll().stream()
                .filter(bill -> bill.getStatus() != PurchaseBillStatus.VOID)
                .filter(bill -> bill.getBillDate() != null
                        && !bill.getBillDate().isBefore(startOfMonth)
                        && !bill.getBillDate().isAfter(today))
                .map(bill -> bill.getSubtotal() != null ? bill.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalExpensesMtd(mtdExpenses);

        // 3. Recent Invoices & Bills (Top 5)
        summary.setRecentInvoices(salesInvoiceRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(salesInvoiceMapper::toDto)
                .collect(Collectors.toList()));

        summary.setRecentBills(purchaseBillRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(purchaseBillMapper::toDto)
                .collect(Collectors.toList()));

        // 4. Low stock products (Basic placeholder implementation for MVP - actual low stock requires inventory table
        // join,
        // but for simplicity, if we have low stock fields on product or we just fetch products with low inventory)
        // Since inventory tracking is a bit more complex (per warehouse), we'll skip detailed low stock here
        // or return an empty list if not easily queryable without native query.

        return summary;
    }
}
