package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.JournalEntryDto;
import com.billos.api.dto.JournalEntryLineDto;
import com.billos.api.entity.Account;
import com.billos.api.entity.JournalEntry;
import com.billos.api.entity.JournalEntryLine;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.JournalEntryMapper;
import com.billos.api.repository.AccountRepository;
import com.billos.api.repository.JournalEntryRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;
    private final JournalEntryMapper journalEntryMapper;

    @Transactional(readOnly = true)
    public List<JournalEntryDto> getAllJournalEntries() {
        return journalEntryRepository.findAll().stream()
                .map(journalEntryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public JournalEntryDto getJournalEntryById(UUID id) {
        return journalEntryRepository
                .findById(id)
                .map(journalEntryMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Journal Entry not found"));
    }

    @Transactional
    @Audited(entity = "JournalEntry", action = "CREATE")
    public JournalEntryDto createJournalEntry(JournalEntryDto dto) {
        if (dto.getLines() == null || dto.getLines().size() < 2) {
            throw new BadRequestException("A journal entry needs at least two lines");
        }

        // Validate Debits == Credits, in paise as stored. A line is a debit or a credit, never negative and never
        // both — otherwise a -100 debit could "balance" a -100 credit and post nonsense to both accounts.
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        for (JournalEntryLineDto line : dto.getLines()) {
            BigDecimal debit = TaxMath.money(line.getDebitAmount() != null ? line.getDebitAmount() : BigDecimal.ZERO);
            BigDecimal credit =
                    TaxMath.money(line.getCreditAmount() != null ? line.getCreditAmount() : BigDecimal.ZERO);
            if (debit.signum() < 0 || credit.signum() < 0) {
                throw new BadRequestException("Journal amounts can't be negative");
            }
            if ((debit.signum() > 0) == (credit.signum() > 0)) {
                throw new BadRequestException("Each journal line needs either a debit or a credit amount, not both");
            }
            line.setDebitAmount(debit);
            line.setCreditAmount(credit);
            totalDebits = totalDebits.add(debit);
            totalCredits = totalCredits.add(credit);
        }

        if (totalDebits.compareTo(totalCredits) != 0) {
            throw new BadRequestException(
                    "Journal Entry must balance. Total Debits: " + totalDebits + ", Total Credits: " + totalCredits);
        }

        JournalEntry entry = journalEntryMapper.toEntity(dto);
        entry.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));

        for (JournalEntryLineDto lineDto : dto.getLines()) {
            JournalEntryLine line = journalEntryMapper.lineToEntity(lineDto);
            Account account = accountRepository
                    .findById(lineDto.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + lineDto.getAccountId()));
            line.setAccount(account);
            entry.addLine(line);

            // Note: Currently we aren't auto-updating account balances in this MVP to prevent race conditions.
            // In a production app, we would either update balances here, or calculate them dynamically on read.
            // For now, balances can be computed via queries.
        }

        JournalEntry savedEntry = journalEntryRepository.save(entry);
        return journalEntryMapper.toDto(savedEntry);
    }
}
