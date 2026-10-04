package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import com.billos.api.dto.Gstr3bDto;
import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillLine;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceLine;
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

    @Test
    void gstr3b_cgstCreditCantPaySgst_soCashIsDueDespiteEqualTotals() {
        // Output CGST 100 + SGST 100; credit CGST 150 + SGST 50. Netting totals says 0 is due — but the law keeps
        // the heads apart: SGST still needs 50 in cash and 50 of CGST credit carries forward.
        Gstr3bDto dto = gstr3b("0", "100", "100", "0", "150", "50");

        ReportService.applyItcSetOff(dto);

        assertCash(dto, "0", "0", "50");
        assertCarryForward(dto, "0", "50", "0");
        assertThat(dto.getTotalCashPayable()).isEqualByComparingTo("50");
        assertThat(dto.getTotalItcCarryForward()).isEqualByComparingTo("50");
    }

    @Test
    void gstr3b_igstCreditCoversIgstFirst_thenTheCgstAndSgstShortfalls() {
        // IGST credit 300: 100 against IGST, then 50 each to the CGST and SGST that have no credit of their own
        Gstr3bDto dto = gstr3b("100", "50", "50", "300", "0", "0");

        ReportService.applyItcSetOff(dto);

        assertCash(dto, "0", "0", "0");
        assertCarryForward(dto, "100", "0", "0");
    }

    @Test
    void gstr3b_cgstAndSgstCreditsCanPayIgst() {
        Gstr3bDto dto = gstr3b("500", "0", "0", "0", "200", "200");

        ReportService.applyItcSetOff(dto);

        assertCash(dto, "100", "0", "0");
        assertCarryForward(dto, "0", "0", "0");
    }

    @Test
    void gstr3b_igstCreditIsUsedUpBeforeOwnHeadCredit() {
        // Rule 88A: IGST credit left after the shortfalls still goes to CGST/SGST before their own credit is touched,
        // so the own-head credit is what carries forward
        Gstr3bDto dto = gstr3b("0", "100", "100", "150", "0", "100");

        ReportService.applyItcSetOff(dto);

        assertCash(dto, "0", "0", "0");
        assertCarryForward(dto, "0", "0", "50");
    }

    @Test
    void gstr3b_reportsTheSetOffForThePeriod() {
        SalesInvoice sale = invoice(SalesInvoiceStatus.ISSUED, "1000.00", "1180.00");
        SalesInvoiceLine saleLine = new SalesInvoiceLine();
        saleLine.setCgstAmount(new BigDecimal("90.00"));
        saleLine.setSgstAmount(new BigDecimal("90.00"));
        sale.addLine(saleLine);
        PurchaseBill purchase = new PurchaseBill();
        purchase.setStatus(PurchaseBillStatus.UNPAID);
        purchase.setBillDate(LocalDate.now());
        purchase.setSubtotal(new BigDecimal("500.00"));
        purchase.setTaxTotal(new BigDecimal("90.00"));
        PurchaseBillLine purchaseLine = new PurchaseBillLine();
        purchaseLine.setIgstAmount(new BigDecimal("90.00")); // bought from another state
        purchase.addLine(purchaseLine);
        when(salesInvoiceRepository.findAll()).thenReturn(List.of(sale));
        when(purchaseBillRepository.findAll()).thenReturn(List.of(purchase));

        Gstr3bDto dto = reportService.getGstr3b(null, null);

        // IGST credit 90 pays CGST 90; SGST 90 is paid in cash
        assertCash(dto, "0", "0", "90.00");
        assertThat(dto.getTotalItcCarryForward()).isEqualByComparingTo("0");
    }

    private static Gstr3bDto gstr3b(String outI, String outC, String outS, String inI, String inC, String inS) {
        Gstr3bDto dto = new Gstr3bDto();
        dto.setOutwardIgst(new BigDecimal(outI));
        dto.setOutwardCgst(new BigDecimal(outC));
        dto.setOutwardSgst(new BigDecimal(outS));
        dto.setInwardIgst(new BigDecimal(inI));
        dto.setInwardCgst(new BigDecimal(inC));
        dto.setInwardSgst(new BigDecimal(inS));
        return dto;
    }

    private static void assertCash(Gstr3bDto dto, String igst, String cgst, String sgst) {
        assertThat(dto.getCashPayableIgst()).as("IGST cash").isEqualByComparingTo(igst);
        assertThat(dto.getCashPayableCgst()).as("CGST cash").isEqualByComparingTo(cgst);
        assertThat(dto.getCashPayableSgst()).as("SGST cash").isEqualByComparingTo(sgst);
    }

    private static void assertCarryForward(Gstr3bDto dto, String igst, String cgst, String sgst) {
        assertThat(dto.getItcCarryForwardIgst()).as("IGST credit left").isEqualByComparingTo(igst);
        assertThat(dto.getItcCarryForwardCgst()).as("CGST credit left").isEqualByComparingTo(cgst);
        assertThat(dto.getItcCarryForwardSgst()).as("SGST credit left").isEqualByComparingTo(sgst);
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
