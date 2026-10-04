package com.billos.api.service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * GST state codes, used to decide whether a supply is intra-state (CGST + SGST) or inter-state (IGST).
 *
 * <p>States are free text on customers and suppliers, so "Maharashtra", "maharashtra ", "MH", "27" and
 * "27-Maharashtra" must all mean the same place — comparing the raw strings charged IGST on intra-state sales
 * whenever two spellings differed. The frontend mirrors this table in {@code src/lib/gst-states.ts}.
 */
public final class GstStates {

    private static final Map<String, String> CODE_BY_NAME = new HashMap<>();

    static {
        state("01", "Jammu and Kashmir", "JK");
        state("02", "Himachal Pradesh", "HP");
        state("03", "Punjab", "PB");
        state("04", "Chandigarh", "CH");
        state("05", "Uttarakhand", "UK", "UT", "Uttaranchal");
        state("06", "Haryana", "HR");
        state("07", "Delhi", "DL", "New Delhi", "NCT of Delhi");
        state("08", "Rajasthan", "RJ");
        state("09", "Uttar Pradesh", "UP");
        state("10", "Bihar", "BR");
        state("11", "Sikkim", "SK");
        state("12", "Arunachal Pradesh", "AR");
        state("13", "Nagaland", "NL");
        state("14", "Manipur", "MN");
        state("15", "Mizoram", "MZ");
        state("16", "Tripura", "TR");
        state("17", "Meghalaya", "ML");
        state("18", "Assam", "AS");
        state("19", "West Bengal", "WB");
        state("20", "Jharkhand", "JH");
        state("21", "Odisha", "OD", "OR", "Orissa");
        state("22", "Chhattisgarh", "CG", "CT", "Chattisgarh");
        state("23", "Madhya Pradesh", "MP");
        state("24", "Gujarat", "GJ");
        // Daman and Diu (code 25) merged into code 26 in 2020
        state("26", "Dadra and Nagar Haveli and Daman and Diu", "DN", "DD", "Daman and Diu", "Dadra and Nagar Haveli");
        state("27", "Maharashtra", "MH");
        state("29", "Karnataka", "KA");
        state("30", "Goa", "GA");
        state("31", "Lakshadweep", "LD");
        state("32", "Kerala", "KL");
        state("33", "Tamil Nadu", "TN");
        state("34", "Puducherry", "PY", "Pondicherry");
        state("35", "Andaman and Nicobar Islands", "AN", "Andaman and Nicobar");
        state("36", "Telangana", "TS", "TG");
        state("37", "Andhra Pradesh", "AP");
        state("38", "Ladakh", "LA");
        state("97", "Other Territory", "OT");
    }

    private GstStates() {}

    private static void state(String code, String... names) {
        for (String name : names) {
            CODE_BY_NAME.put(normalize(name), code);
        }
    }

    /** Lower-case letters, digits and single spaces; "&" reads as "and". */
    private static String normalize(String text) {
        return text.toLowerCase(Locale.ROOT)
                .replace("&", " and ")
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /** The two-digit GST state code for a state name, abbreviation or code ("Maharashtra", "MH", "27"). */
    public static Optional<String> codeOf(String state) {
        if (state == null || state.isBlank()) {
            return Optional.empty();
        }
        String key = normalize(state);
        if (key.matches("\\d{1,2}")) {
            String code = key.length() == 1 ? "0" + key : key;
            return CODE_BY_NAME.containsValue(code) ? Optional.of(code) : Optional.empty();
        }
        String code = CODE_BY_NAME.get(key);
        if (code == null) {
            // "27 Maharashtra", "Maharashtra (27)"
            code = CODE_BY_NAME.get(
                    key.replaceAll("\\d", " ").replaceAll("\\s+", " ").trim());
        }
        return Optional.ofNullable(code);
    }

    /** The state code a GSTIN was issued in: its first two digits. */
    public static Optional<String> codeOfGstin(String gstin) {
        if (gstin == null) {
            return Optional.empty();
        }
        String trimmed = gstin.trim();
        if (trimmed.length() < 2 || !trimmed.substring(0, 2).matches("\\d{2}")) {
            return Optional.empty();
        }
        return codeOf(trimmed.substring(0, 2));
    }

    /** A party's state code: from its state field, or else from its GSTIN. */
    public static Optional<String> codeOf(String state, String gstin) {
        return codeOf(state).or(() -> codeOfGstin(gstin));
    }

    /**
     * Whether a supply between the organization and a counterparty crosses a state border (IGST). When either side's
     * state can't be resolved to a code, falls back to comparing the normalized text; when either is unknown, the
     * supply is treated as intra-state.
     */
    public static boolean isInterState(String orgState, String orgGstin, String partyState, String partyGstin) {
        Optional<String> orgCode = codeOf(orgState, orgGstin);
        Optional<String> partyCode = codeOf(partyState, partyGstin);
        if (orgCode.isPresent() && partyCode.isPresent()) {
            return !orgCode.get().equals(partyCode.get());
        }
        if (orgState == null || orgState.isBlank() || partyState == null || partyState.isBlank()) {
            return false;
        }
        return !normalize(orgState).equals(normalize(partyState));
    }
}
