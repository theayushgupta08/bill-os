package com.billos.api.controller;

import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.service.DocumentGenerationService;
import com.billos.api.service.SalesInvoiceService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sales-invoices")
@RequiredArgsConstructor
public class SalesInvoiceController {

    private final SalesInvoiceService salesInvoiceService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SalesInvoiceDto>> getAllSalesInvoices() {
        return ResponseEntity.ok(salesInvoiceService.getAllSalesInvoices());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<SalesInvoiceDto> getSalesInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(salesInvoiceService.getSalesInvoiceById(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<byte[]> getSalesInvoicePdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generateInvoicePdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"invoice-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<SalesInvoiceDto> createSalesInvoice(@RequestBody SalesInvoiceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesInvoiceService.createSalesInvoice(dto));
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<SalesInvoiceDto> issueInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(salesInvoiceService.issueInvoice(id));
    }

    @GetMapping("/{id}/e-invoice")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Map<String, Object>> getEInvoiceJson(@PathVariable UUID id) {
        return ResponseEntity.ok(salesInvoiceService.generateEInvoiceJson(id));
    }

    @GetMapping("/next-number")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Map<String, String>> getNextInvoiceNumber() {
        return ResponseEntity.ok(Map.of("nextInvoiceNumber", salesInvoiceService.getNextInvoiceNumberPreview()));
    }
}
