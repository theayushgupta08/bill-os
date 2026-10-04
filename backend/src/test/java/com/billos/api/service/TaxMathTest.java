package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.billos.api.exception.BadRequestException;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class TaxMathTest {

    @ParameterizedTest
    @CsvSource({
        "100.00, 18, 18.00", // plain
        "10.10, 5, 0.51", // 0.505 rounds half-up
        "33.33, 12, 4.00", // 3.9996
        "0.01, 18, 0.00", // under half a paisa
        "1000.00, 0.25, 2.50", // fractional rate
    })
    void percentOf_roundsToPaiseHalfUp(String base, String rate, String expected) {
        assertThat(TaxMath.percentOf(new BigDecimal(base), new BigDecimal(rate)))
                .isEqualByComparingTo(expected);
    }

    @ParameterizedTest
    @CsvSource({"0.51, 0.26", "0.50, 0.25", "0.01, 0.01", "18.00, 9.00", "0.00, 0.00"})
    void cgstHalf_andSgstRemainder_alwaysSumToTheTax(String tax, String expectedCgst) {
        BigDecimal total = new BigDecimal(tax);
        BigDecimal cgst = TaxMath.cgstHalf(total);
        BigDecimal sgst = total.subtract(cgst);

        assertThat(cgst).isEqualByComparingTo(expectedCgst);
        assertThat(cgst.add(sgst)).isEqualByComparingTo(total);
        assertThat(cgst.subtract(sgst).abs()).isLessThanOrEqualTo(new BigDecimal("0.01"));
    }

    @Test
    void lineQuantity_isStoredAtTwoDecimals() {
        assertThat(TaxMath.lineQuantity(new BigDecimal("1.005"))).isEqualByComparingTo("1.01");
        assertThat(TaxMath.lineQuantity(new BigDecimal("3"))).hasScaleOf(2);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"0", "-1", "0.004"})
    void lineQuantity_mustBePositive(BigDecimal quantity) {
        assertThatThrownBy(() -> TaxMath.lineQuantity(quantity)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void unitPrice_allowsFreeItems_butNotNegativePrices() {
        assertThat(TaxMath.unitPrice(BigDecimal.ZERO)).isEqualByComparingTo("0");
        assertThat(TaxMath.unitPrice(new BigDecimal("10.005"))).isEqualByComparingTo("10.01");
        assertThatThrownBy(() -> TaxMath.unitPrice(new BigDecimal("-0.01"))).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> TaxMath.unitPrice(null)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void positiveAmount_roundsToPaise_andNamesTheFieldWhenInvalid() {
        assertThat(TaxMath.positiveAmount(new BigDecimal("0.19999999999999998"), "Amount"))
                .isEqualByComparingTo("0.20");
        assertThatThrownBy(() -> TaxMath.positiveAmount(new BigDecimal("-5"), "Expense amount"))
                .hasMessage("Expense amount must be greater than zero");
    }
}
