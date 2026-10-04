package com.billos.api.repository;

import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceStatus;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SalesInvoiceRepository extends JpaRepository<SalesInvoice, UUID> {
    List<SalesInvoice> findTop5ByOrderByCreatedAtDesc();

    /**
     * Amount still due per customer on the current organization's own invoices (SalesInvoice is {@code @TenantId},
     * so this never includes another organization's documents). Rows are {@code [UUID customerId, BigDecimal due]}.
     */
    @Query("SELECT si.customer.id, SUM(si.totalAmount - si.amountPaid) FROM SalesInvoice si "
            + "WHERE si.status IN :statuses GROUP BY si.customer.id")
    List<Object[]> sumDueByCustomer(@Param("statuses") Collection<SalesInvoiceStatus> statuses);
}
