package com.billos.api.controller;

import com.billos.api.dto.HsnSummaryDto;
import com.billos.api.service.GstReportingService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** GST return helpers. The per-invoice e-invoice (INV-01) payload is served by GET /sales-invoices/{id}/e-invoice. */
@RestController
@RequestMapping("/api/v1/reports/gst")
@RequiredArgsConstructor
public class GstReportController {

    private final GstReportingService gstReportingService;

    @GetMapping("/hsn-summary")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<HsnSummaryDto>> getHsnSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(gstReportingService.getHsnSummary(startDate, endDate));
    }
}
