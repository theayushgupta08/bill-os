package com.billos.api.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Money arithmetic for document totals: everything is rounded to paise (2 dp, half-up) as GST invoices require. */
public final class TaxMath {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWO = new BigDecimal("2");

    private TaxMath() {}

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    /** {@code rate}% of {@code base}, rounded to paise. */
    public static BigDecimal percentOf(BigDecimal base, BigDecimal rate) {
        return money(base.multiply(rate).divide(HUNDRED));
    }

    /** CGST half of an intra-state tax; SGST is {@code tax - cgst} so the two always sum to the tax exactly. */
    public static BigDecimal cgstHalf(BigDecimal tax) {
        return money(tax.divide(TWO));
    }
}
