package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.PurchaseOrderLineDto;
import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.QuotationLineDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.dto.SalesInvoiceLineDto;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

/** Renders the real PDF templates (as Spring Boot configures Thymeleaf) and checks the amounts they print. */
class DocumentTemplateRenderingTest {

    private final SpringTemplateEngine engine = new SpringTemplateEngine();

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        engine.setTemplateResolver(resolver);
    }

    @Test
    void invoice_printsTaxableValue_gstPerHead_total_andBalanceDue() {
        // 2 x 500.00 at 18% intra-state, 300.00 already paid
        SalesInvoiceLineDto line = new SalesInvoiceLineDto();
        line.setProductName("Widget");
        line.setQuantity(new BigDecimal("2.00"));
        line.setUnitPrice(new BigDecimal("500.00"));
        line.setTaxAmount(new BigDecimal("180.00"));
        line.setCgstAmount(new BigDecimal("90.00"));
        line.setSgstAmount(new BigDecimal("90.00"));
        line.setIgstAmount(new BigDecimal("0.00"));
        line.setLineTotal(new BigDecimal("1180.00"));
        SalesInvoiceDto invoice = new SalesInvoiceDto();
        invoice.setInvoiceNumber("INV-0001");
        invoice.setInvoiceDate(LocalDate.of(2026, 10, 4));
        invoice.setLines(List.of(line));
        invoice.setSubtotal(new BigDecimal("1000.00"));
        invoice.setTaxTotal(new BigDecimal("180.00"));
        invoice.setTotalAmount(new BigDecimal("1180.00"));
        invoice.setAmountPaid(new BigDecimal("300.00"));

        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("gst", DocumentGenerationService.gstTotals(invoice.getLines()));
        context.setVariable("dates", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String html = engine.process("invoice_template", context);

        // Regression: "Subtotal" printed the GST-inclusive total and tax was a hard-coded "Tax (0%) $0.00"
        assertThat(html).doesNotContain("Tax (0%)").doesNotContain("$");
        assertThat(row(html, "Taxable Value")).contains("Rs. 1000.00");
        assertThat(row(html, "CGST")).contains("Rs. 90.00");
        assertThat(row(html, "SGST")).contains("Rs. 90.00");
        assertThat(html).doesNotContain(">IGST<"); // nothing inter-state on this invoice
        assertThat(row(html, "Total")).contains("Rs. 1180.00");
        assertThat(row(html, "Amount Paid")).contains("Rs. 300.00");
        assertThat(row(html, "Balance Due")).contains("Rs. 880.00");
        // The line shows its taxable value and GST, so qty x rate reconciles to the amount
        assertThat(html).contains(">1000.00<").contains(">180.00<").contains(">1180.00<");

        // ...and the PDF renderer (a strict XHTML parser that only logs on failure) prints the same figures
        assertThat(pdfText(html)).contains("Rs. 1000.00", "Rs. 90.00", "Rs. 1180.00", "Rs. 880.00");
    }

    @Test
    void invoice_interState_printsIgstOnly_andNoBalanceRowsWhenUnpaid() {
        SalesInvoiceLineDto line = new SalesInvoiceLineDto();
        line.setProductName("Widget");
        line.setQuantity(new BigDecimal("1.00"));
        line.setUnitPrice(new BigDecimal("100.00"));
        line.setTaxAmount(new BigDecimal("12.00"));
        line.setIgstAmount(new BigDecimal("12.00"));
        line.setLineTotal(new BigDecimal("112.00"));
        SalesInvoiceDto invoice = new SalesInvoiceDto();
        invoice.setLines(List.of(line));
        invoice.setSubtotal(new BigDecimal("100.00"));
        invoice.setTotalAmount(new BigDecimal("112.00"));
        invoice.setAmountPaid(BigDecimal.ZERO);

        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("gst", DocumentGenerationService.gstTotals(invoice.getLines()));
        context.setVariable("dates", DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        String html = engine.process("invoice_template", context);

        assertThat(row(html, "IGST")).contains("Rs. 12.00");
        assertThat(html).doesNotContain(">CGST<").doesNotContain("Balance Due");
    }

    @Test
    void quotationAndPurchaseOrder_printTaxableValueGstAndTotal() {
        QuotationLineDto quoteLine = new QuotationLineDto();
        quoteLine.setProductName("Widget");
        quoteLine.setQuantity(new BigDecimal("4.00"));
        quoteLine.setUnitPrice(new BigDecimal("25.00"));
        quoteLine.setTaxAmount(new BigDecimal("5.00"));
        quoteLine.setLineTotal(new BigDecimal("105.00"));
        QuotationDto quote = new QuotationDto();
        quote.setLines(List.of(quoteLine));
        quote.setSubtotal(new BigDecimal("100.00"));
        quote.setTaxTotal(new BigDecimal("5.00"));
        quote.setTotalAmount(new BigDecimal("105.00"));

        PurchaseOrderLineDto poLine = new PurchaseOrderLineDto();
        poLine.setProductName("Widget");
        poLine.setQuantity(new BigDecimal("4.00"));
        poLine.setUnitPrice(new BigDecimal("25.00"));
        poLine.setTaxAmount(new BigDecimal("5.00"));
        poLine.setLineTotal(new BigDecimal("105.00"));
        PurchaseOrderDto po = new PurchaseOrderDto();
        po.setLines(List.of(poLine));
        po.setSubtotal(new BigDecimal("100.00"));
        po.setTaxTotal(new BigDecimal("5.00"));
        po.setTotalAmount(new BigDecimal("105.00"));

        Context context = new Context();
        context.setVariable("quote", quote);
        context.setVariable("po", po);
        context.setVariable("dates", DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        for (String template : List.of("quotation_template", "po_template")) {
            String html = engine.process(template, context);
            assertThat(html).as(template).doesNotContain("$");
            assertThat(row(html, "Taxable Value")).as(template).contains("Rs. 100.00");
            assertThat(row(html, "GST")).as(template).contains("Rs. 5.00");
            assertThat(row(html, "Total")).as(template).contains("Rs. 105.00");
            assertThat(pdfText(html)).as(template).contains("Rs. 100.00", "Rs. 5.00", "Rs. 105.00");
        }
    }

    /** The text of the PDF {@link DocumentGenerationService} produces from {@code html}. */
    private static String pdfText(String html) {
        DocumentGenerationService generator = new DocumentGenerationService(null, null, null, null, null);
        try (org.apache.pdfbox.pdmodel.PDDocument pdf =
                org.apache.pdfbox.pdmodel.PDDocument.load(generator.generatePdfFromHtml(html))) {
            return new org.apache.pdfbox.text.PDFTextStripper().getText(pdf);
        } catch (java.io.IOException e) {
            throw new AssertionError(e);
        }
    }

    /** The totals-table row whose label cell is {@code label}. */
    private static String row(String html, String label) {
        int start = html.indexOf("<td>" + label + "</td>");
        assertThat(start).as("row " + label).isNotNegative();
        return html.substring(start, html.indexOf("</tr>", start));
    }
}
