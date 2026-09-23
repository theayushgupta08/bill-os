package com.billos.api.controller;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.service.DocumentGenerationService;
import com.billos.api.service.PurchaseOrderService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final DocumentGenerationService documentGenerationService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<PurchaseOrderDto>> getAllPurchaseOrders() {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<PurchaseOrderDto> getPurchaseOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<byte[]> getPurchaseOrderPdf(@PathVariable UUID id) {
        byte[] pdfBytes = documentGenerationService.generatePurchaseOrderPdf(id);
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"po-" + id + ".pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<PurchaseOrderDto> createPurchaseOrder(@RequestBody PurchaseOrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseOrderService.createPurchaseOrder(dto));
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<PurchaseOrderDto> issueOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(purchaseOrderService.issueOrder(id));
    }
}
