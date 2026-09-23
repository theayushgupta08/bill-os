package com.billos.api.service;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.entity.OrganizationSettings;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.tenant.TenantContext;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
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
    private final OrganizationSettingsRepository organizationSettingsRepository;

    public byte[] generateInvoicePdf(UUID invoiceId) {
        SalesInvoiceDto invoice = salesInvoiceService.getSalesInvoiceById(invoiceId);
        Context context = new Context();
        context.setVariable("invoice", invoice);
        context.setVariable("dates", dateFormatter());
        String html = templateEngine.process("invoice_template", context);
        return generatePdfFromHtml(html);
    }

    public byte[] generateQuotationPdf(UUID quoteId) {
        QuotationDto quote = quotationService.getQuotationById(quoteId);
        Context context = new Context();
        context.setVariable("quote", quote);
        context.setVariable("dates", dateFormatter());
        String html = templateEngine.process("quotation_template", context);
        return generatePdfFromHtml(html);
    }

    public byte[] generatePurchaseOrderPdf(UUID poId) {
        PurchaseOrderDto po = purchaseOrderService.getPurchaseOrderById(poId);
        Context context = new Context();
        context.setVariable("po", po);
        context.setVariable("dates", dateFormatter());
        String html = templateEngine.process("po_template", context);
        return generatePdfFromHtml(html);
    }

    /** Date format from the organization's preferences (Settings → Preferences), used by the PDF templates. */
    DateTimeFormatter dateFormatter() {
        String tenant = TenantContext.getCurrentTenant();
        String stored = tenant == null
                ? null
                : organizationSettingsRepository
                        .findByOrganizationId(UUID.fromString(tenant))
                        .map(OrganizationSettings::getDateFormat)
                        .orElse(null);
        return DateTimeFormatter.ofPattern(toJavaPattern(stored));
    }

    static String toJavaPattern(String storedFormat) {
        if ("MM/DD/YYYY".equals(storedFormat)) return "MM/dd/yyyy";
        if ("YYYY-MM-DD".equals(storedFormat)) return "yyyy-MM-dd";
        return "dd/MM/yyyy";
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
