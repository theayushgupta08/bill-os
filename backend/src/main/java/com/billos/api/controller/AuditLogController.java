package com.billos.api.controller;

import com.billos.api.dto.AuditLogDto;
import com.billos.api.service.AuditLogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.hasRole('ADMIN')")
    public ResponseEntity<List<AuditLogDto>> getRecentLogs() {
        return ResponseEntity.ok(auditLogService.getRecentLogs());
    }
}
