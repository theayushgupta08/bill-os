package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class DashboardSummaryDto {
    private BigDecimal totalRevenueMtd;
    private BigDecimal totalExpensesMtd;
    private BigDecimal outstandingReceivables;
    private BigDecimal outstandingPayables;

    private List<SalesInvoiceDto> recentInvoices;
    private List<PurchaseBillDto> recentBills;
    private List<ProductDto> lowStockProducts; // Alternatively a simple map/record
}
