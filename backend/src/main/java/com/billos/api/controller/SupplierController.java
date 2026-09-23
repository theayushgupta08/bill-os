package com.billos.api.controller;

import com.billos.api.dto.SupplierDto;
import com.billos.api.service.SupplierService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SupplierDto>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<SupplierDto> getSupplierById(@PathVariable UUID id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<SupplierDto> createSupplier(@RequestBody SupplierDto supplierDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(supplierDto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<SupplierDto> updateSupplier(@PathVariable UUID id, @RequestBody SupplierDto supplierDto) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, supplierDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<Void> deleteSupplier(@PathVariable UUID id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}
