package com.billos.api.controller;

import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.service.SalesInvoiceService;
import com.billos.api.service.DocumentGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales-invoices")
@RequiredArgsConstructor
public class SalesInvoiceController {

    private final SalesInvoiceService salesInvoiceService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    public ResponseEntity<List<SalesInvoiceDto>> getAllSalesInvoices() {
        return ResponseEntity.ok(salesInvoiceService.getAllSalesInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesInvoiceDto> getSalesInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(salesInvoiceService.getSalesInvoiceById(id));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getSalesInvoicePdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generateInvoicePdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"invoice-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    public ResponseEntity<SalesInvoiceDto> createSalesInvoice(@RequestBody SalesInvoiceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesInvoiceService.createSalesInvoice(dto));
    }
}
