package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class JournalEntryLineDto {
    private UUID id;
    private UUID accountId;
    private String accountName;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private String description;
}
