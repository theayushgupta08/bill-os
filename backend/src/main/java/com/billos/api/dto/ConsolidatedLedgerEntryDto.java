package com.billos.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsolidatedLedgerEntryDto {
    private UUID id;
    private LocalDate transactionDate;
    private String transactionType; // INVOICE, PAYMENT
    private String documentNumber;
    private UUID organizationId;
    private String branchName;
    private String branchGstin;
    private String branchCode;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal runningBalance;
    private String notes;
}
