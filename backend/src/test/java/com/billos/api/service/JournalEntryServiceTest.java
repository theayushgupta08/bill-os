package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.JournalEntryDto;
import com.billos.api.dto.JournalEntryLineDto;
import com.billos.api.entity.Account;
import com.billos.api.entity.JournalEntry;
import com.billos.api.entity.JournalEntryLine;
import com.billos.api.mapper.JournalEntryMapper;
import com.billos.api.repository.AccountRepository;
import com.billos.api.repository.JournalEntryRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class JournalEntryServiceTest {

    @Mock
    private JournalEntryRepository journalEntryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private JournalEntryMapper journalEntryMapper;

    @InjectMocks
    private JournalEntryService journalEntryService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
    }

    @Test
    void createJournalEntry_balanced_success() {
        JournalEntryDto dto = new JournalEntryDto();
        dto.setEntryDate(LocalDate.now());
        dto.setDescription("Initial Investment");

        JournalEntryLineDto debit = new JournalEntryLineDto();
        debit.setAccountId(UUID.randomUUID());
        debit.setDebitAmount(new BigDecimal("1000.00"));
        debit.setCreditAmount(BigDecimal.ZERO);

        JournalEntryLineDto credit = new JournalEntryLineDto();
        credit.setAccountId(UUID.randomUUID());
        credit.setDebitAmount(BigDecimal.ZERO);
        credit.setCreditAmount(new BigDecimal("1000.00"));

        dto.setLines(new ArrayList<>());
        dto.getLines().add(debit);
        dto.getLines().add(credit);

        when(journalEntryMapper.toEntity(any(JournalEntryDto.class))).thenReturn(new JournalEntry());
        when(journalEntryMapper.lineToEntity(any(JournalEntryLineDto.class))).thenReturn(new JournalEntryLine());
        when(accountRepository.findById(any(UUID.class))).thenReturn(Optional.of(new Account()));
        when(journalEntryRepository.save(any(JournalEntry.class))).thenReturn(new JournalEntry());
        when(journalEntryMapper.toDto(any(JournalEntry.class))).thenReturn(new JournalEntryDto());

        JournalEntryDto result = journalEntryService.createJournalEntry(dto);

        assertNotNull(result);
        verify(journalEntryRepository, times(1)).save(any(JournalEntry.class));
    }

    @Test
    void createJournalEntry_unbalanced_throwsException() {
        JournalEntryDto dto = new JournalEntryDto();
        dto.setEntryDate(LocalDate.now());
        dto.setDescription("Unbalanced Entry");

        JournalEntryLineDto debit = new JournalEntryLineDto();
        debit.setAccountId(UUID.randomUUID());
        debit.setDebitAmount(new BigDecimal("1000.00"));
        debit.setCreditAmount(BigDecimal.ZERO);

        JournalEntryLineDto credit = new JournalEntryLineDto();
        credit.setAccountId(UUID.randomUUID());
        credit.setDebitAmount(BigDecimal.ZERO);
        credit.setCreditAmount(new BigDecimal("999.00")); // Mismatch!

        dto.setLines(new ArrayList<>());
        dto.getLines().add(debit);
        dto.getLines().add(credit);

        com.billos.api.exception.BadRequestException exception =
                assertThrows(com.billos.api.exception.BadRequestException.class, () -> {
                    journalEntryService.createJournalEntry(dto);
                });

        assertNotNull(exception);
        verify(journalEntryRepository, never()).save(any());
    }

    @Test
    void createJournalEntry_rejectsNegativeAmountsThatHappenToBalance() {
        // Regression: a -100 debit and a -100 credit "balanced" and were posted
        JournalEntryDto dto = entry(line("-100.00", "0"), line("0", "-100.00"));

        assertThatThrownBy(() -> journalEntryService.createJournalEntry(dto))
                .isInstanceOf(com.billos.api.exception.BadRequestException.class)
                .hasMessageContaining("can't be negative");
        verify(journalEntryRepository, never()).save(any());
    }

    @Test
    void createJournalEntry_rejectsALineWithBothADebitAndACredit() {
        JournalEntryDto dto = entry(line("100.00", "100.00"), line("50.00", "0"), line("0", "50.00"));

        assertThatThrownBy(() -> journalEntryService.createJournalEntry(dto))
                .hasMessageContaining("either a debit or a credit");
    }

    @Test
    void createJournalEntry_rejectsAnAllZeroEntry() {
        JournalEntryDto dto = entry(line("0", "0"), line("0", "0"));

        assertThatThrownBy(() -> journalEntryService.createJournalEntry(dto))
                .hasMessageContaining("either a debit or a credit");
    }

    @Test
    void createJournalEntry_comparesTotalsInPaise() {
        // 0.1 + 0.2 debits against a 0.3 credit balance (a float sum would be 0.30000000000000004)
        JournalEntryDto dto = entry(line("0.1", "0"), line("0.2", "0"), line("0", "0.3"));
        when(journalEntryMapper.toEntity(any(JournalEntryDto.class))).thenReturn(new JournalEntry());
        when(journalEntryMapper.lineToEntity(any(JournalEntryLineDto.class))).thenReturn(new JournalEntryLine());
        when(accountRepository.findById(any(UUID.class))).thenReturn(Optional.of(new Account()));
        when(journalEntryRepository.save(any(JournalEntry.class))).thenReturn(new JournalEntry());
        when(journalEntryMapper.toDto(any(JournalEntry.class))).thenReturn(new JournalEntryDto());

        journalEntryService.createJournalEntry(dto);

        verify(journalEntryRepository).save(any(JournalEntry.class));
        assertThat(dto.getLines().get(2).getCreditAmount()).isEqualByComparingTo("0.30");
    }

    private static JournalEntryDto entry(JournalEntryLineDto... lines) {
        JournalEntryDto dto = new JournalEntryDto();
        dto.setEntryDate(LocalDate.now());
        dto.setLines(new ArrayList<>(java.util.List.of(lines)));
        return dto;
    }

    private static JournalEntryLineDto line(String debit, String credit) {
        JournalEntryLineDto line = new JournalEntryLineDto();
        line.setAccountId(UUID.randomUUID());
        line.setDebitAmount(new BigDecimal(debit));
        line.setCreditAmount(new BigDecimal(credit));
        return line;
    }
}
