package com.billos.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import com.billos.api.dto.PnlDto;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private PurchaseBillRepository purchaseBillRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @Mock
    private PurchaseBillMapper purchaseBillMapper;

    @InjectMocks
    private ReportService reportService;

    @Test
    void testGetProfitAndLoss() {
        SalesInvoice i1 = new SalesInvoice();
        i1.setTotalAmount(new BigDecimal("1000.00"));
        i1.setStatus(SalesInvoiceStatus.ISSUED);
        i1.setInvoiceDate(LocalDate.now());

        PurchaseBill pb1 = new PurchaseBill();
        pb1.setTotalAmount(new BigDecimal("400.00"));
        pb1.setStatus(PurchaseBillStatus.UNPAID);
        pb1.setBillDate(LocalDate.now());

        when(salesInvoiceRepository.findAll()).thenReturn(List.of(i1));
        when(purchaseBillRepository.findAll()).thenReturn(List.of(pb1));

        PnlDto result = reportService.getProfitAndLoss(null, null);

        assertNotNull(result);
        assertEquals(new BigDecimal("1000.00"), result.getTotalRevenue());
        assertEquals(new BigDecimal("400.00"), result.getTotalPurchases());
        assertEquals(new BigDecimal("600.00"), result.getNetProfit());
    }
}
