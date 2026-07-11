package com.billos.api.service;

import com.billos.api.dto.AccountDto;
import com.billos.api.entity.Account;
import com.billos.api.entity.AccountType;
import com.billos.api.mapper.AccountMapper;
import com.billos.api.repository.AccountRepository;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;

    @Transactional(readOnly = true)
    public List<AccountDto> getAllAccounts() {
        return accountRepository.findAll().stream()
                .map(accountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountDto getAccountById(UUID id) {
        return accountRepository.findById(id)
                .map(accountMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    @Transactional
    public AccountDto createAccount(AccountDto dto) {
        Account account = accountMapper.toEntity(dto);
        account.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        
        if (dto.getParentId() != null) {
            Account parent = accountRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent account not found"));
            account.setParent(parent);
        }
        
        Account savedAccount = accountRepository.save(account);
        return accountMapper.toDto(savedAccount);
    }

    @Transactional
    public AccountDto updateAccount(UUID id, AccountDto dto) {
        Account existingAccount = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        
        accountMapper.updateEntityFromDto(dto, existingAccount);
        
        if (dto.getParentId() != null) {
            Account parent = accountRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent account not found"));
            existingAccount.setParent(parent);
        } else {
            existingAccount.setParent(null);
        }
        
        Account updatedAccount = accountRepository.save(existingAccount);
        return accountMapper.toDto(updatedAccount);
    }

    @Transactional
    public void deleteAccount(UUID id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        accountRepository.delete(account);
    }

    @Transactional
    public void seedDefaultAccounts(UUID organizationId) {
        // Run this in the context of the new tenant, or temporarily bypass it since we explicitly set it.
        // It's safer to explicitly set it here since it might be called during organization creation
        // before the TenantContext is fully active for the new org.
        
        createDefaultAccount(organizationId, "1000", "Cash", AccountType.ASSET);
        createDefaultAccount(organizationId, "1200", "Accounts Receivable", AccountType.ASSET);
        createDefaultAccount(organizationId, "1500", "Inventory", AccountType.ASSET);
        
        createDefaultAccount(organizationId, "2000", "Accounts Payable", AccountType.LIABILITY);
        createDefaultAccount(organizationId, "2200", "Sales Tax Payable", AccountType.LIABILITY);
        
        createDefaultAccount(organizationId, "3000", "Owner's Equity", AccountType.EQUITY);
        createDefaultAccount(organizationId, "3900", "Retained Earnings", AccountType.EQUITY);
        
        createDefaultAccount(organizationId, "4000", "Sales Revenue", AccountType.REVENUE);
        createDefaultAccount(organizationId, "4500", "Discount Given", AccountType.REVENUE);
        
        createDefaultAccount(organizationId, "5000", "Cost of Goods Sold", AccountType.EXPENSE);
        createDefaultAccount(organizationId, "6000", "Bank Fees", AccountType.EXPENSE);
        createDefaultAccount(organizationId, "6100", "Rent Expense", AccountType.EXPENSE);
        createDefaultAccount(organizationId, "6200", "Salary Expense", AccountType.EXPENSE);
    }

    private void createDefaultAccount(UUID organizationId, String code, String name, AccountType type) {
        Account account = new Account();
        account.setOrganizationId(organizationId);
        account.setAccountCode(code);
        account.setName(name);
        account.setType(type);
        account.setActive(true);
        accountRepository.save(account);
    }
}
