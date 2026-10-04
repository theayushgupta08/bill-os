package com.billos.api.service;

import com.billos.api.entity.Customer;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.repository.SalesInvoiceRepository;
import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * What a customer owes the <i>current</i> organization.
 *
 * <p>A customer can be shared by a parent with its branches, but {@code customers.outstanding_balance} is a single
 * column. It belongs to the owning organization (opening balance + its own invoices − its own receipts); branches
 * never write to it ({@link SalesInvoiceService}, {@link PaymentService}). A branch's balance for a customer it
 * doesn't own is computed from its own issued invoices instead — so no organization sees another's receivables.
 */
@Service
@RequiredArgsConstructor
public class CustomerBalanceService {

    private static final EnumSet<SalesInvoiceStatus> OPEN =
            EnumSet.of(SalesInvoiceStatus.ISSUED, SalesInvoiceStatus.PARTIAL);

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final SharedEntityResolver sharedEntityResolver;

    /**
     * A balance lookup for the current organization. The shared-customer figures are queried once, on first use;
     * call it inside the caller's (read-only) transaction.
     */
    public Function<Customer, BigDecimal> forCurrentOrg() {
        AtomicReference<Map<UUID, BigDecimal>> dueOnOwnInvoices = new AtomicReference<>();
        return customer -> {
            if (sharedEntityResolver.isOwnedByCurrentOrg(customer.getOrganizationId())) {
                return customer.getOutstandingBalance() != null ? customer.getOutstandingBalance() : BigDecimal.ZERO;
            }
            return dueOnOwnInvoices
                    .updateAndGet(due -> due != null ? due : dueByCustomer())
                    .getOrDefault(customer.getId(), BigDecimal.ZERO);
        };
    }

    private Map<UUID, BigDecimal> dueByCustomer() {
        Map<UUID, BigDecimal> due = new HashMap<>();
        for (Object[] row : salesInvoiceRepository.sumDueByCustomer(OPEN)) {
            due.put((UUID) row[0], row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO);
        }
        return due;
    }
}
