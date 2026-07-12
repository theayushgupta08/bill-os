package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class PnlDto {
    private BigDecimal totalRevenue;
    private BigDecimal totalPurchases;
    private BigDecimal netProfit;
}
