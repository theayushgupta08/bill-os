package com.billos.api.service;

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
}
