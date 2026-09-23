package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.entity.Account;
import com.billos.api.exception.ConflictException;
import com.billos.api.mapper.AccountMapper;
import com.billos.api.repository.AccountRepository;
import com.billos.api.repository.JournalEntryLineRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private AccountMapper accountMapper;

    @Mock
    private JournalEntryLineRepository journalEntryLineRepository;

    @InjectMocks
    private AccountService accountService;

    private final UUID id = UUID.randomUUID();

    private Account account() {
        Account a = new Account();
        a.setId(id);
        a.setName("Cash");
        return a;
    }

    @Test
    void deleteAccount_refuses_whenJournalLinesReferenceIt() {
        when(accountRepository.findById(id)).thenReturn(Optional.of(account()));
        when(journalEntryLineRepository.existsByAccount_Id(id)).thenReturn(true);

        assertThatThrownBy(() -> accountService.deleteAccount(id))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("journal entries");
        verify(accountRepository, never()).delete(any());
    }

    @Test
    void deleteAccount_refuses_whenItHasSubAccounts() {
        when(accountRepository.findById(id)).thenReturn(Optional.of(account()));
        when(accountRepository.existsByParent_Id(id)).thenReturn(true);

        assertThatThrownBy(() -> accountService.deleteAccount(id)).isInstanceOf(ConflictException.class);
        verify(accountRepository, never()).delete(any());
    }

    @Test
    void deleteAccount_deletes_whenUnused() {
        Account a = account();
        when(accountRepository.findById(id)).thenReturn(Optional.of(a));

        accountService.deleteAccount(id);

        verify(accountRepository).delete(a);
    }
}
