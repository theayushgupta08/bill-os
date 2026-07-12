package com.billos.api.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class Gstr3bDto {
    private BigDecimal outwardTaxableValue = BigDecimal.ZERO;
    private BigDecimal outwardCgst = BigDecimal.ZERO;
    private BigDecimal outwardSgst = BigDecimal.ZERO;
    private BigDecimal outwardIgst = BigDecimal.ZERO;
    private BigDecimal outwardTotalTax = BigDecimal.ZERO;

    private BigDecimal inwardTaxableValue = BigDecimal.ZERO;
    private BigDecimal inwardCgst = BigDecimal.ZERO;
    private BigDecimal inwardSgst = BigDecimal.ZERO;
    private BigDecimal inwardIgst = BigDecimal.ZERO;
    private BigDecimal inwardTotalTax = BigDecimal.ZERO;
}
