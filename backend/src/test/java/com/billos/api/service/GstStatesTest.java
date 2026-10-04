package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class GstStatesTest {

    @ParameterizedTest
    @CsvSource({
        "Maharashtra, 27",
        "  maharashtra , 27",
        "MH, 27",
        "27, 27",
        "27-Maharashtra, 27",
        "Maharashtra (27), 27",
        "Tamil Nadu, 33",
        "tamil  nadu, 33",
        "7, 07",
        "NCT of Delhi, 07",
        "Orissa, 21",
        "Pondicherry, 34",
        "Jammu & Kashmir, 01",
        "Daman and Diu, 26",
        "Telangana, 36",
        "TG, 36",
        "Andhra Pradesh, 37",
    })
    void codeOf_acceptsNamesAbbreviationsAndCodes(String state, String code) {
        assertThat(GstStates.codeOf(state)).contains(code);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Atlantis", "98", "25", "Maharastra"})
    void codeOf_isEmptyForUnknownStates(String state) {
        assertThat(GstStates.codeOf(state)).isEmpty();
    }

    @Test
    void codeOfGstin_readsTheFirstTwoDigits() {
        assertThat(GstStates.codeOfGstin("29ABCDE1234F1Z5")).contains("29");
        assertThat(GstStates.codeOfGstin(" 07AAACB1234C1Z9 ")).contains("07");
        assertThat(GstStates.codeOfGstin("URP")).isEmpty();
        assertThat(GstStates.codeOfGstin(null)).isEmpty();
    }

    @Test
    void isInterState_comparesStates_notSpellings() {
        assertThat(GstStates.isInterState("Maharashtra", null, "MH", null)).isFalse();
        assertThat(GstStates.isInterState("Maharashtra", null, "maharashtra ", null))
                .isFalse();
        assertThat(GstStates.isInterState("Maharashtra", null, "Karnataka", null))
                .isTrue();
    }

    @Test
    void isInterState_fallsBackToTheGstin_whenNoStateIsTyped() {
        assertThat(GstStates.isInterState("Maharashtra", null, null, "29ABCDE1234F1Z5"))
                .isTrue();
        assertThat(GstStates.isInterState(null, "27AAAAA0000A1Z5", "", "27ABCDE1234F1Z5"))
                .isFalse();
    }

    @Test
    void isInterState_typedStateWinsOverTheGstin() {
        // A Karnataka-registered buyer billed at its Maharashtra branch: the billing state decides
        assertThat(GstStates.isInterState("Maharashtra", null, "Maharashtra", "29ABCDE1234F1Z5"))
                .isFalse();
    }

    @Test
    void isInterState_withAnUnknownSide_comparesTheTextOrDefaultsToIntraState() {
        assertThat(GstStates.isInterState("Atlantis", null, "atlantis", null)).isFalse();
        assertThat(GstStates.isInterState("Atlantis", null, "Lemuria", null)).isTrue();
        assertThat(GstStates.isInterState("Maharashtra", null, null, null)).isFalse();
        assertThat(GstStates.isInterState(null, null, "Karnataka", null)).isFalse();
    }
}
