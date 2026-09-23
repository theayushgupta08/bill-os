package com.billos.api.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
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
    void profitAndLoss_usesTaxableValues_andIgnoresDraftInvoices() {
        SalesInvoice issued = invoice(SalesInvoiceStatus.ISSUED, "1000.00", "1180.00");
        SalesInvoice draft = invoice(SalesInvoiceStatus.DRAFT, "5000.00", "5900.00");

        PurchaseBill pb1 = new PurchaseBill();
        pb1.setStatus(PurchaseBillStatus.UNPAID);
        pb1.setBillDate(LocalDate.now());
        PurchaseBillDto pb1Dto = new PurchaseBillDto();
        pb1Dto.setSubtotal(new BigDecimal("400.00"));
        pb1Dto.setTotalAmount(new BigDecimal("472.00")); // incl. 18% input GST
        pb1Dto.setStatus(PurchaseBillStatus.UNPAID);

        SalesInvoiceDto issuedDto = new SalesInvoiceDto();
        issuedDto.setSubtotal(new BigDecimal("1000.00"));
        issuedDto.setTotalAmount(new BigDecimal("1180.00")); // incl. 18% output GST
        issuedDto.setStatus(SalesInvoiceStatus.ISSUED);

        when(salesInvoiceRepository.findAll()).thenReturn(List.of(issued, draft));
        when(purchaseBillRepository.findAll()).thenReturn(List.of(pb1));
        when(salesInvoiceMapper.toDto(issued)).thenReturn(issuedDto);
        when(purchaseBillMapper.toDto(pb1)).thenReturn(pb1Dto);

        PnlDto result = reportService.getProfitAndLoss(null, null);

        assertNotNull(result);
        assertEquals(0, new BigDecimal("1000.00").compareTo(result.getTotalRevenue()));
        assertEquals(0, new BigDecimal("400.00").compareTo(result.getTotalPurchases()));
        assertEquals(0, new BigDecimal("600.00").compareTo(result.getNetProfit()));
    }

    @Test
    void gstReturns_excludeDraftAndVoidInvoices() {
        SalesInvoice issued = invoice(SalesInvoiceStatus.ISSUED, "1000.00", "1180.00");
        SalesInvoice paid = invoice(SalesInvoiceStatus.PAID, "500.00", "590.00");
        SalesInvoice draft = invoice(SalesInvoiceStatus.DRAFT, "9000.00", "10620.00");
        SalesInvoice voided = invoice(SalesInvoiceStatus.VOID, "7000.00", "8260.00");
        when(salesInvoiceRepository.findAll()).thenReturn(List.of(issued, paid, draft, voided));
        when(purchaseBillRepository.findAll()).thenReturn(List.of());

        assertEquals(2, reportService.getGstr1(null, null).size());
        assertEquals(
                0,
                new BigDecimal("1500.00")
                        .compareTo(reportService.getGstr3b(null, null).getOutwardTaxableValue()));
    }

    private SalesInvoice invoice(SalesInvoiceStatus status, String subtotal, String total) {
        SalesInvoice inv = new SalesInvoice();
        inv.setStatus(status);
        inv.setInvoiceDate(LocalDate.now());
        inv.setInvoiceNumber("INV-" + status);
        inv.setSubtotal(new BigDecimal(subtotal));
        inv.setTaxTotal(new BigDecimal(total).subtract(new BigDecimal(subtotal)));
        inv.setTotalAmount(new BigDecimal(total));
        inv.setCustomer(new com.billos.api.entity.Customer());
        return inv;
    }
}
