package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.billos.api.entity.OrganizationSettings;
import com.billos.api.repository.OrganizationSettingsRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrganizationClockTest {

    @Mock
    private OrganizationSettingsRepository organizationSettingsRepository;

    @InjectMocks
    private OrganizationClock organizationClock;

    private final UUID orgId = UUID.randomUUID();

    @Test
    void zoneOf_usesTheOrganizationsSetting() {
        stubTimezone("America/New_York");

        assertThat(organizationClock.zoneOf(orgId)).isEqualTo(ZoneId.of("America/New_York"));
    }

    @Test
    void zoneOf_defaultsToIndia_whenUnsetOrInvalid() {
        stubTimezone("Not/AZone");
        assertThat(organizationClock.zoneOf(orgId)).isEqualTo(ZoneId.of("Asia/Kolkata"));

        when(organizationSettingsRepository.findByOrganizationId(orgId)).thenReturn(Optional.empty());
        assertThat(organizationClock.zoneOf(orgId)).isEqualTo(ZoneId.of("Asia/Kolkata"));
    }

    @Test
    void today_isTheDateInTheOrganizationsZone() {
        stubTimezone("Pacific/Kiritimati"); // UTC+14: a different date from UTC for most of the day

        assertThat(organizationClock.today(orgId)).isEqualTo(LocalDate.now(ZoneId.of("Pacific/Kiritimati")));
    }

    @Test
    void dayOf_convertsTheInstant_notJustTheLocalPart() {
        // 20:00 UTC on 4 Oct is 01:30 on 5 Oct in India
        OffsetDateTime verifiedAt = OffsetDateTime.of(2026, 10, 4, 20, 0, 0, 0, ZoneOffset.UTC);

        assertThat(OrganizationClock.dayOf(verifiedAt, ZoneId.of("Asia/Kolkata")))
                .isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(verifiedAt.toLocalDate()).isEqualTo(LocalDate.of(2026, 10, 4));
    }

    private void stubTimezone(String zone) {
        OrganizationSettings settings = new OrganizationSettings();
        settings.setTimezone(zone);
        when(organizationSettingsRepository.findByOrganizationId(orgId)).thenReturn(Optional.of(settings));
    }
}
