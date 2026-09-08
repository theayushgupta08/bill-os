package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsolidatedCustomerLedgerDto {
    private CustomerDto customer;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private BigDecimal netOutstandingBalance;
    private List<ConsolidatedLedgerEntryDto> entries;
}
