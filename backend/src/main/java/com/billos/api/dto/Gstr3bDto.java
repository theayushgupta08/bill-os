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

    // Output tax left to pay in cash per head once input tax credit is set off under the GST rules (s.49, rule 88A):
    // CGST credit can't pay SGST and vice versa, so this is not simply output tax minus input tax
    private BigDecimal cashPayableCgst = BigDecimal.ZERO;
    private BigDecimal cashPayableSgst = BigDecimal.ZERO;
    private BigDecimal cashPayableIgst = BigDecimal.ZERO;
    private BigDecimal totalCashPayable = BigDecimal.ZERO;

    // Input tax credit left unused per head, carried forward to the next period
    private BigDecimal itcCarryForwardCgst = BigDecimal.ZERO;
    private BigDecimal itcCarryForwardSgst = BigDecimal.ZERO;
    private BigDecimal itcCarryForwardIgst = BigDecimal.ZERO;
    private BigDecimal totalItcCarryForward = BigDecimal.ZERO;
}
