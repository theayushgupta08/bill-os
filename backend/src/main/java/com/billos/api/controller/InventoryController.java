package com.billos.api.controller;

import com.billos.api.audit.Audited;
import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.StockMovementDto;
import com.billos.api.service.InventoryService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/levels")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<InventoryLevelDto>> getAllInventoryLevels() {
        return ResponseEntity.ok(inventoryService.getAllInventoryLevels());
    }

    @GetMapping("/products/{productId}/movements")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<StockMovementDto>> getProductMovements(@PathVariable UUID productId) {
        return ResponseEntity.ok(inventoryService.getProductMovements(productId));
    }

    @PostMapping("/adjust")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    // Audited here, not in InventoryService: the service also runs once per line of every invoice/bill
    @Audited(entity = "StockMovement", action = "MANUAL_ADJUST")
    public ResponseEntity<StockMovementDto> adjustStock(@RequestBody StockMovementDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.adjustStock(request));
    }
}
