package com.billos.api.dto;

import com.billos.api.entity.AccountType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class AccountDto {
    private UUID id;
    private String accountCode;
    private String name;
    private String description;
    private AccountType type;
    private UUID parentId;
    private BigDecimal balance;
    private boolean isActive;
}
