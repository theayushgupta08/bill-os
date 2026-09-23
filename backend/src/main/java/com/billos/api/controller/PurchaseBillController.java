package com.billos.api.controller;

import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.service.PurchaseBillService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/purchase-bills")
@RequiredArgsConstructor
public class PurchaseBillController {

    private final PurchaseBillService purchaseBillService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<PurchaseBillDto>> getAllPurchaseBills() {
        return ResponseEntity.ok(purchaseBillService.getAllPurchaseBills());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<PurchaseBillDto> getPurchaseBillById(@PathVariable UUID id) {
        return ResponseEntity.ok(purchaseBillService.getPurchaseBillById(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<PurchaseBillDto> createPurchaseBill(@RequestBody PurchaseBillDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(purchaseBillService.createPurchaseBill(dto));
    }
}
