package com.billos.api.service;

import com.billos.api.repository.SalesInvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GstReportingService {

    private final SalesInvoiceRepository salesInvoiceRepository;

    /**
     * Placeholder for generating HSN summaries.
     * In a full implementation, this would aggregate sales_invoice_lines by HSN code.
     */
    public Map<String, Object> getHsnSummary() {
        Map<String, Object> mockSummary = new HashMap<>();
        mockSummary.put("status", "SUCCESS");
        mockSummary.put("data", "Mock HSN Summary Data. Real calculation requires HSN codes on products.");
        return mockSummary;
    }

    /**
     * Placeholder for E-Invoice JSON (FORM INV-01).
     * Deferred to E-Invoicing Sprint.
     */
    public String getEInvoiceJson(String invoiceId) {
        return "{\n  \"Version\": \"1.1\",\n  \"Note\": \"Deferred to dedicated E-Invoicing sprint\"\n}";
    }
}
