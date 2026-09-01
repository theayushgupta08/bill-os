package com.billos.api.controller;

import com.billos.api.dto.*;
import com.billos.api.security.UserPrincipal;
import com.billos.api.service.CollectionService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    // --- QR Code Management ---

    @GetMapping("/qr")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CollectionQrCodeDto>> getQrCodes() {
        return ResponseEntity.ok(collectionService.getQrCodes());
    }

    @PostMapping("/qr")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<CollectionQrCodeDto> createQrCode(@RequestBody CollectionQrCodeDto dto) {
        return ResponseEntity.ok(collectionService.createQrCode(dto));
    }

    @PutMapping("/qr/{id}")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<CollectionQrCodeDto> updateQrCode(
            @PathVariable UUID id, @RequestBody CollectionQrCodeDto dto) {
        return ResponseEntity.ok(collectionService.updateQrCode(id, dto));
    }

    // --- Record Collection Payments ---

    @GetMapping("/payments")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CollectionPaymentDto>> getPayments() {
        return ResponseEntity.ok(collectionService.getPayments());
    }

    @PostMapping("/payments")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<CollectionPaymentDto> recordPayment(@RequestBody CollectionPaymentDto dto) {
        return ResponseEntity.ok(collectionService.recordPayment(dto));
    }

    @PostMapping("/payments/{id}/verify")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Map<String, String>> verifyPayment(
            @PathVariable UUID id, @RequestBody Map<String, Object> payload) {
        Boolean verify = (Boolean) payload.get("verify");
        String remarks = (String) payload.get("remarks");
        if (verify == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'verify' is required"));
        }
        collectionService.verifyPayment(id, verify, remarks);
        return ResponseEntity.ok(Map.of("message", verify ? "Payment verified" : "Payment rejected"));
    }

    // --- Collection Balance ---

    @GetMapping("/balance")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<Map<String, Object>> getBalance(
            @RequestParam(required = false) UUID userId, @AuthenticationPrincipal UserPrincipal principal) {
        UUID targetUserId = userId != null ? userId : principal.getId();
        return ResponseEntity.ok(Map.of("balance", collectionService.getUserBalance(targetUserId)));
    }

    // --- Expenses ---

    @GetMapping("/expenses")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CollectionExpenseDto>> getExpenses() {
        return ResponseEntity.ok(collectionService.getExpenses());
    }

    @PostMapping("/expenses")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<CollectionExpenseDto> recordExpense(@RequestBody CollectionExpenseDto dto) {
        return ResponseEntity.ok(collectionService.recordExpense(dto));
    }

    @PostMapping("/expenses/{id}/approve")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> approveExpense(
            @PathVariable UUID id, @RequestBody Map<String, Boolean> payload) {
        Boolean approve = payload.get("approve");
        if (approve == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'approve' is required"));
        }
        collectionService.approveExpense(id, approve);
        return ResponseEntity.ok(Map.of("message", approve ? "Expense approved" : "Expense rejected"));
    }

    // --- Settlement Deposits ---

    @GetMapping("/deposits")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<SettlementDepositDto>> getDeposits() {
        return ResponseEntity.ok(collectionService.getDeposits());
    }

    @PostMapping("/deposits")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<SettlementDepositDto> recordDeposit(@RequestBody SettlementDepositDto dto) {
        return ResponseEntity.ok(collectionService.recordDeposit(dto));
    }

    @PostMapping("/deposits/{id}/approve")
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> approveDeposit(
            @PathVariable UUID id, @RequestBody Map<String, Boolean> payload) {
        Boolean approve = payload.get("approve");
        if (approve == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Field 'approve' is required"));
        }
        collectionService.approveDeposit(id, approve);
        return ResponseEntity.ok(Map.of("message", approve ? "Deposit approved" : "Deposit rejected"));
    }

    // --- Collection Ledger ---

    @GetMapping("/ledger")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<CollectionLedgerDto>> getLedger() {
        return ResponseEntity.ok(collectionService.getLedger());
    }

    // --- Dashboard Metrics ---

    @GetMapping("/dashboard/owner")
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<OwnerDashboardDto> getOwnerDashboard() {
        return ResponseEntity.ok(collectionService.getOwnerDashboard());
    }

    @GetMapping("/dashboard/user")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<UserDashboardDto> getUserDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(collectionService.getUserDashboard(principal.getId()));
    }
}
