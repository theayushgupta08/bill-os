package com.billos.api.controller;

import com.billos.api.dto.SalesOrderDto;
import com.billos.api.service.SalesOrderService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SalesOrderDto>> getAllSalesOrders() {
        return ResponseEntity.ok(salesOrderService.getAllSalesOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<SalesOrderDto> getSalesOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(salesOrderService.getSalesOrderById(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<SalesOrderDto> createSalesOrder(@RequestBody SalesOrderDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.createSalesOrder(dto));
    }
}
