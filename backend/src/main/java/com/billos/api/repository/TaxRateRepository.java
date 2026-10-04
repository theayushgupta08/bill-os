package com.billos.api.repository;

import com.billos.api.entity.TaxRate;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {

    /** True when any sales or purchase document line references the tax rate. */
    @Query("""
            SELECT CASE WHEN
                EXISTS (SELECT 1 FROM SalesInvoiceLine l WHERE l.taxRate.id = :id)
                OR EXISTS (SELECT 1 FROM SalesOrderLine l WHERE l.taxRate.id = :id)
                OR EXISTS (SELECT 1 FROM QuotationLine l WHERE l.taxRate.id = :id)
                OR EXISTS (SELECT 1 FROM PurchaseOrderLine l WHERE l.taxRate.id = :id)
                OR EXISTS (SELECT 1 FROM PurchaseBillLine l WHERE l.taxRate.id = :id)
            THEN true ELSE false END
            """)
    boolean isUsedOnDocuments(@Param("id") UUID id);
}
