package com.billos.api.security;

import java.util.List;

/** Per-organization roles, most to least privileged. The single source for role order and rank checks. */
public final class Roles {

    public static final String OWNER = "OWNER";
    public static final String ADMIN = "ADMIN";

    public static final List<String> HIERARCHY = List.of(OWNER, ADMIN, "MANAGER", "USER", "VIEWER");

    private Roles() {}

    public static boolean isValid(String role) {
        return level(role) != -1;
    }

    /** 0 for OWNER up to 4 for VIEWER; -1 for null or anything that isn't a role. */
    public static int level(String role) {
        // List.of(...) rejects null lookups with an NPE, so "no role" has to be handled before asking it
        return role == null ? -1 : HIERARCHY.indexOf(role);
    }

    /** True when {@code role} is at least {@code required} (OWNER satisfies everything). */
    public static boolean satisfies(String role, String required) {
        int level = level(role);
        int requiredLevel = level(required);
        return level != -1 && requiredLevel != -1 && level <= requiredLevel;
    }

    /** True when {@code a} is strictly more privileged than {@code b}. */
    public static boolean outranks(String a, String b) {
        int levelA = level(a);
        int levelB = level(b);
        return levelA != -1 && levelB != -1 && levelA < levelB;
    }

    /** The more privileged of two roles; a null or unknown role loses to a valid one. */
    public static String higherOf(String a, String b) {
        if (level(b) == -1) {
            return a;
        }
        if (level(a) == -1) {
            return b;
        }
        return level(a) <= level(b) ? a : b;
    }
}
