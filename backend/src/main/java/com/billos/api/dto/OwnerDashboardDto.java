package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OwnerDashboardDto {
    private BigDecimal totalOutstandingCollections;
    private long pendingVerificationCount;
    private BigDecimal pendingVerificationSum;
    private BigDecimal collectionsToday;
    private BigDecimal depositsToday;
    private BigDecimal expensesToday;
    private List<Map<String, Object>> topCollectors;
    private List<Map<String, Object>> highOutstandingUsers;
}
