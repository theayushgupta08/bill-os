package com.billos.api.controller;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.StockMovementDto;
import com.billos.api.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/levels")
    public ResponseEntity<List<InventoryLevelDto>> getAllInventoryLevels() {
        return ResponseEntity.ok(inventoryService.getAllInventoryLevels());
    }

    @GetMapping("/products/{productId}/movements")
    public ResponseEntity<List<StockMovementDto>> getProductMovements(@PathVariable UUID productId) {
        return ResponseEntity.ok(inventoryService.getProductMovements(productId));
    }

    @PostMapping("/adjust")
    public ResponseEntity<StockMovementDto> adjustStock(@RequestBody StockMovementDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.adjustStock(request));
    }
}
