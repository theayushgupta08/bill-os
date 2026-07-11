package com.billos.api.controller;

import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.service.SalesInvoiceService;
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

    @GetMapping
    public ResponseEntity<List<SalesInvoiceDto>> getAllSalesInvoices() {
        return ResponseEntity.ok(salesInvoiceService.getAllSalesInvoices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SalesInvoiceDto> getSalesInvoiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(salesInvoiceService.getSalesInvoiceById(id));
    }

    @PostMapping
    public ResponseEntity<SalesInvoiceDto> createSalesInvoice(@RequestBody SalesInvoiceDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesInvoiceService.createSalesInvoice(dto));
    }
}
