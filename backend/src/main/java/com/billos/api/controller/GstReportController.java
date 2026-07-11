package com.billos.api.controller;

import com.billos.api.service.GstReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports/gst")
@RequiredArgsConstructor
public class GstReportController {

    private final GstReportingService gstReportingService;

    @GetMapping("/hsn-summary")
    public ResponseEntity<Map<String, Object>> getHsnSummary() {
        return ResponseEntity.ok(gstReportingService.getHsnSummary());
    }

    @GetMapping("/einvoice/{invoiceId}")
    public ResponseEntity<String> getEInvoiceJson(@PathVariable String invoiceId) {
        return ResponseEntity.ok()
                .header("Content-Type", "application/json")
                .body(gstReportingService.getEInvoiceJson(invoiceId));
    }
}
