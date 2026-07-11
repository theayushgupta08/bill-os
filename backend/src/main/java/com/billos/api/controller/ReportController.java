package com.billos.api.controller;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-register")
    public ResponseEntity<List<SalesInvoiceDto>> getSalesRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getSalesRegister(startDate, endDate));
    }

    @GetMapping("/purchase-register")
    public ResponseEntity<List<PurchaseBillDto>> getPurchaseRegister(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getPurchaseRegister(startDate, endDate));
    }

    @GetMapping("/stock-summary")
    public ResponseEntity<List<InventoryLevelDto>> getStockSummary() {
        return ResponseEntity.ok(reportService.getStockSummary());
    }

    @GetMapping("/pnl")
    public ResponseEntity<PnlDto> getProfitAndLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getProfitAndLoss(startDate, endDate));
    }
}
