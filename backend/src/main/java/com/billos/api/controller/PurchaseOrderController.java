package com.billos.api.controller;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.service.PurchaseOrderService;
import com.billos.api.service.DocumentGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrderDto>> getAllPurchaseOrders() {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderDto> getPurchaseOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getPurchaseOrderPdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generatePurchaseOrderPdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"po-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(@RequestBody PurchaseOrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseOrderService.createPurchaseOrder(dto));
    }

    @PostMapping("/{id}/issue")
    public ResponseEntity<PurchaseOrderDto> issueOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.issueOrder(id));
    }
}
