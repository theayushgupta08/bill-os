package com.billos.api.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PnlDto {
    private BigDecimal totalRevenue;
    private BigDecimal totalPurchases;
    private BigDecimal netProfit;
}
