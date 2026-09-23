package com.billos.api.controller;

import com.billos.api.dto.CustomerDto;
import com.billos.api.dto.Gstr1Dto;
import com.billos.api.dto.Gstr3bDto;
import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.dto.SupplierDto;
import com.billos.api.service.ReportService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-register")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SalesInvoiceDto>> getSalesRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getSalesRegister(startDate, endDate));
    }

    @GetMapping("/purchase-register")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<PurchaseBillDto>> getPurchaseRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getPurchaseRegister(startDate, endDate));
    }

    @GetMapping("/stock-summary")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<InventoryLevelDto>> getStockSummary() {
        return ResponseEntity.ok(reportService.getStockSummary());
    }

    @GetMapping("/pnl")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<PnlDto> getProfitAndLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getProfitAndLoss(startDate, endDate));
    }

    @GetMapping("/outstanding-receivables")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CustomerDto>> getOutstandingReceivables() {
        return ResponseEntity.ok(reportService.getOutstandingReceivables());
    }

    @GetMapping("/outstanding-payables")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SupplierDto>> getOutstandingPayables() {
        return ResponseEntity.ok(reportService.getOutstandingPayables());
    }

    @GetMapping("/gstr1")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<Gstr1Dto>> getGstr1(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getGstr1(startDate, endDate));
    }

    @GetMapping("/gstr3b")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Gstr3bDto> getGstr3b(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getGstr3b(startDate, endDate));
    }
}
