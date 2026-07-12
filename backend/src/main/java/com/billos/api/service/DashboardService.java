package com.billos.api.service;

import com.billos.api.dto.DashboardSummaryDto;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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

    private final SalesInvoiceMapper salesInvoiceMapper;
    private final PurchaseBillMapper purchaseBillMapper;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        DashboardSummaryDto summary = new DashboardSummaryDto();

        // 1. Outstanding Receivables & Payables
        BigDecimal totalReceivables = customerRepository.findAll().stream()
                .map(c -> c.getOutstandingBalance() != null ? c.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setOutstandingReceivables(totalReceivables);

        BigDecimal totalPayables = supplierRepository.findAll().stream()
                .map(s -> s.getOutstandingBalance() != null ? s.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setOutstandingPayables(totalPayables);

        // 2. MTD Revenue & Expenses
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);

        BigDecimal mtdRevenue = salesInvoiceRepository.findAll().stream()
                .filter(inv -> !inv.getStatus().name().equals("VOID"))
                .filter(inv -> !inv.getInvoiceDate().isBefore(startOfMonth))
                .map(inv -> inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        summary.setTotalRevenueMtd(mtdRevenue);

        BigDecimal mtdExpenses = purchaseBillRepository.findAll().stream()
                .filter(bill -> !bill.getStatus().name().equals("VOID"))
                .filter(bill -> !bill.getBillDate().isBefore(startOfMonth))
                .map(bill -> bill.getTotalAmount() != null ? bill.getTotalAmount() : BigDecimal.ZERO)
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
