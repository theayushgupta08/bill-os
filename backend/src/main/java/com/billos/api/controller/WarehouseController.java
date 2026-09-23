package com.billos.api.controller;

import com.billos.api.dto.WarehouseDto;
import com.billos.api.service.WarehouseService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<WarehouseDto>> getAllWarehouses() {
        return ResponseEntity.ok(warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<WarehouseDto> getWarehouseById(@PathVariable UUID id) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<WarehouseDto> createWarehouse(@RequestBody WarehouseDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.createWarehouse(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<WarehouseDto> updateWarehouse(@PathVariable UUID id, @RequestBody WarehouseDto dto) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<Void> deleteWarehouse(@PathVariable UUID id) {
        warehouseService.deleteWarehouse(id);
        return ResponseEntity.noContent().build();
    }
}
