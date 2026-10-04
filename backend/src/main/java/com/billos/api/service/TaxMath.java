package com.billos.api.service;

import com.billos.api.exception.BadRequestException;
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

    /**
     * A document line's quantity as it is stored (the column holds 2 dp), so that the saved quantity × rate is the
     * amount the totals were computed from. Zero or negative quantities would shrink the bill while stock still moves.
     */
    public static BigDecimal lineQuantity(BigDecimal quantity) {
        if (quantity == null || money(quantity).signum() <= 0) {
            throw new BadRequestException("Each line needs a quantity greater than zero");
        }
        return money(quantity);
    }

    /** A document line's unit price as it is stored (2 dp). Zero is allowed (free items); negative is not. */
    public static BigDecimal unitPrice(BigDecimal price) {
        if (price == null || price.signum() < 0) {
            throw new BadRequestException("Unit price is required and can't be negative");
        }
        return money(price);
    }

    /** A user-entered amount in paise, which must be greater than zero ({@code what} names it in the error). */
    public static BigDecimal positiveAmount(BigDecimal amount, String what) {
        if (amount == null || money(amount).signum() <= 0) {
            throw new BadRequestException(what + " must be greater than zero");
        }
        return money(amount);
    }
}
