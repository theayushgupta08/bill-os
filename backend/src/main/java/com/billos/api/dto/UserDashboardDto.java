package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDashboardDto {
    private BigDecimal currentCollectionBalance;
    private long pendingVerificationCount;
    private BigDecimal todayCollections;
    private BigDecimal todayExpenses;
    private BigDecimal todayDeposits;
}
