package com.billos.api.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.SalesInvoiceDto;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@ExtendWith(MockitoExtension.class)
public class DocumentGenerationServiceTest {

    @Mock
    private TemplateEngine templateEngine;

    @Mock
    private SalesInvoiceService salesInvoiceService;

    @Mock
    private QuotationService quotationService;

    @Mock
    private PurchaseOrderService purchaseOrderService;

    @Mock
    private com.billos.api.repository.OrganizationSettingsRepository organizationSettingsRepository;

    @InjectMocks
    private DocumentGenerationService documentGenerationService;

    @Test
    void testGenerateInvoicePdf() {
        UUID invoiceId = UUID.randomUUID();
        when(salesInvoiceService.getSalesInvoiceById(invoiceId)).thenReturn(new SalesInvoiceDto());
        when(templateEngine.process(eq("invoice_template"), any(Context.class)))
                .thenReturn("<html><body><h1>Test Invoice</h1></body></html>");

        byte[] pdf = documentGenerationService.generateInvoicePdf(invoiceId);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void testGenerateQuotationPdf() {
        UUID quoteId = UUID.randomUUID();
        when(quotationService.getQuotationById(quoteId)).thenReturn(new QuotationDto());
        when(templateEngine.process(eq("quotation_template"), any(Context.class)))
                .thenReturn("<html><body><h1>Test Quotation</h1></body></html>");

        byte[] pdf = documentGenerationService.generateQuotationPdf(quoteId);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void testGeneratePurchaseOrderPdf() {
        UUID poId = UUID.randomUUID();
        when(purchaseOrderService.getPurchaseOrderById(poId)).thenReturn(new PurchaseOrderDto());
        when(templateEngine.process(eq("po_template"), any(Context.class)))
                .thenReturn("<html><body><h1>Test PO</h1></body></html>");

        byte[] pdf = documentGenerationService.generatePurchaseOrderPdf(poId);

        assertNotNull(pdf);
        assertTrue(pdf.length > 0);
    }

    @Test
    void testGeneratePdfFromHtml_InvalidHtmlThrowsException() {
        org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () -> {
            documentGenerationService.generatePdfFromHtml("<html><body>No closing tags");
        });
    }

    @org.junit.jupiter.api.Test
    void dateFormatter_followsOrganizationPreference() {
        java.util.UUID orgId = java.util.UUID.randomUUID();
        com.billos.api.tenant.TenantContext.setCurrentTenant(orgId.toString());
        try {
            com.billos.api.entity.OrganizationSettings settings = new com.billos.api.entity.OrganizationSettings();
            settings.setDateFormat("MM/DD/YYYY");
            when(organizationSettingsRepository.findByOrganizationId(orgId))
                    .thenReturn(java.util.Optional.of(settings));

            String formatted = documentGenerationService.dateFormatter().format(java.time.LocalDate.of(2026, 9, 23));

            org.assertj.core.api.Assertions.assertThat(formatted).isEqualTo("09/23/2026");
        } finally {
            com.billos.api.tenant.TenantContext.clear();
        }
    }

    @org.junit.jupiter.api.Test
    void toJavaPattern_defaultsToIndianDayFirst() {
        org.assertj.core.api.Assertions.assertThat(DocumentGenerationService.toJavaPattern(null))
                .isEqualTo("dd/MM/yyyy");
        org.assertj.core.api.Assertions.assertThat(DocumentGenerationService.toJavaPattern("YYYY-MM-DD"))
                .isEqualTo("yyyy-MM-dd");
    }
}
