package com.billos.api.controller;

import com.billos.api.dto.QuotationDto;
import com.billos.api.service.QuotationService;
import com.billos.api.service.DocumentGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    public ResponseEntity<List<QuotationDto>> getAllQuotations() {
        return ResponseEntity.ok(quotationService.getAllQuotations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuotationDto> getQuotation(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationService.getQuotationById(id));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getQuotationPdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generateQuotationPdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"quotation-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    public ResponseEntity<QuotationDto> createQuotation(@RequestBody QuotationDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationService.createQuotation(dto));
    }
}
