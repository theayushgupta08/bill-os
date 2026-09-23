package com.billos.api.controller;

import com.billos.api.dto.PaymentDto;
import com.billos.api.service.PaymentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<PaymentDto>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @PostMapping("/receipts")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<PaymentDto> recordReceipt(@RequestBody PaymentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordReceipt(dto));
    }

    @PostMapping("/vouchers")
    @PreAuthorize("@tenantSecurity.hasRole('USER')")
    public ResponseEntity<PaymentDto> recordPayment(@RequestBody PaymentDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordPayment(dto));
    }
}
