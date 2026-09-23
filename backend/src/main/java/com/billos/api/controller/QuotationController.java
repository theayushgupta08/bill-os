package com.billos.api.controller;

import com.billos.api.dto.QuotationDto;
import com.billos.api.service.DocumentGenerationService;
import com.billos.api.service.QuotationService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/quotations")
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<QuotationDto>> getAllQuotations() {
        return ResponseEntity.ok(quotationService.getAllQuotations());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<QuotationDto> getQuotation(@PathVariable UUID id) {
        return ResponseEntity.ok(quotationService.getQuotationById(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<byte[]> getQuotationPdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generateQuotationPdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"quotation-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<QuotationDto> createQuotation(@RequestBody QuotationDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quotationService.createQuotation(dto));
    }
}
