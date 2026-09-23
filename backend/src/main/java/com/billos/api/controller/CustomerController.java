package com.billos.api.controller;

import com.billos.api.dto.BulkImportResultDto;
import com.billos.api.dto.CustomerDto;
import com.billos.api.service.CustomerService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CustomerDto>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<CustomerDto> getCustomerById(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/{id}/consolidated-ledger")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<com.billos.api.dto.ConsolidatedCustomerLedgerDto> getConsolidatedLedger(
            @PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getConsolidatedLedger(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<CustomerDto> createCustomer(@RequestBody CustomerDto customerDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(customerDto));
    }

    @PostMapping("/bulk")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<BulkImportResultDto> bulkCreateCustomers(@RequestBody List<CustomerDto> dtos) {
        return ResponseEntity.ok(customerService.bulkCreateCustomers(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<CustomerDto> updateCustomer(@PathVariable UUID id, @RequestBody CustomerDto customerDto) {
        return ResponseEntity.ok(customerService.updateCustomer(id, customerDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
