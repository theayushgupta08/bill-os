package com.billos.api.service;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
public class DocumentGenerationService {

    private final TemplateEngine templateEngine;
    private final SalesInvoiceService salesInvoiceService;
    private final QuotationService quotationService;
    private final PurchaseOrderService purchaseOrderService;

    public byte[] generateInvoicePdf(UUID invoiceId) {
        SalesInvoiceDto invoice = salesInvoiceService.getSalesInvoiceById(invoiceId);
        Context context = new Context();
        context.setVariable("invoice", invoice);
        String html = templateEngine.process("invoice_template", context);
        return generatePdfFromHtml(html);
    }

    public byte[] generateQuotationPdf(UUID quoteId) {
        QuotationDto quote = quotationService.getQuotationById(quoteId);
        Context context = new Context();
        context.setVariable("quote", quote);
        String html = templateEngine.process("quotation_template", context);
        return generatePdfFromHtml(html);
    }

    public byte[] generatePurchaseOrderPdf(UUID poId) {
        PurchaseOrderDto po = purchaseOrderService.getPurchaseOrderById(poId);
        Context context = new Context();
        context.setVariable("po", po);
        String html = templateEngine.process("po_template", context);
        return generatePdfFromHtml(html);
    }

    public byte[] generatePdfFromHtml(String htmlContent) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(htmlContent, "classpath:/templates/");
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
