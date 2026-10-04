package com.billos.api.service;

import com.billos.api.entity.OrganizationSettings;
import com.billos.api.repository.OrganizationSettingsRepository;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Calendar days in the organization's time zone (Settings → Preferences), not the server's. The server runs in UTC,
 * so "today" and "this month" taken from {@code LocalDate.now()} were still the previous day for Indian users until
 * 05:30 IST.
 */
@Service
@RequiredArgsConstructor
public class OrganizationClock {

    static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Kolkata");

    private final OrganizationSettingsRepository organizationSettingsRepository;

    public ZoneId zoneOf(UUID organizationId) {
        return organizationSettingsRepository
                .findByOrganizationId(organizationId)
                .map(OrganizationSettings::getTimezone)
                .flatMap(OrganizationClock::parseZone)
                .orElse(DEFAULT_ZONE);
    }

    public LocalDate today(UUID organizationId) {
        return LocalDate.now(zoneOf(organizationId));
    }

    /** The calendar day a timestamp falls on in {@code zone}. */
    public static LocalDate dayOf(OffsetDateTime timestamp, ZoneId zone) {
        return timestamp.atZoneSameInstant(zone).toLocalDate();
    }

    static Optional<ZoneId> parseZone(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(ZoneId.of(id.trim()));
        } catch (DateTimeException e) {
            return Optional.empty();
        }
    }
}
