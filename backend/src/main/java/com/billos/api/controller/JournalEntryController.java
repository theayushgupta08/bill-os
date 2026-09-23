package com.billos.api.controller;

import com.billos.api.dto.JournalEntryDto;
import com.billos.api.service.JournalEntryService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/journal-entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    @GetMapping
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<List<JournalEntryDto>> getAllJournalEntries() {
        return ResponseEntity.ok(journalEntryService.getAllJournalEntries());
    }

    @GetMapping("/{id}")
    @PreAuthorize("@tenantSecurity.isMember()")
    public ResponseEntity<JournalEntryDto> getJournalEntryById(@PathVariable UUID id) {
        return ResponseEntity.ok(journalEntryService.getJournalEntryById(id));
    }

    @PostMapping
    @PreAuthorize("@tenantSecurity.hasRole('MANAGER')")
    public ResponseEntity<JournalEntryDto> createJournalEntry(@RequestBody JournalEntryDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(journalEntryService.createJournalEntry(dto));
    }
}
