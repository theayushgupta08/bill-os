package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.dto.TaxRateDto;
import com.billos.api.entity.TaxRate;
import com.billos.api.exception.ConflictException;
import com.billos.api.mapper.TaxRateMapper;
import com.billos.api.repository.TaxRateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TaxRateServiceTest {

    @Mock
    private TaxRateRepository taxRateRepository;

    @Mock
    private TaxRateMapper taxRateMapper;

    @InjectMocks
    private TaxRateService taxRateService;

    private final UUID id = UUID.randomUUID();

    private TaxRate existing() {
        TaxRate t = new TaxRate();
        t.setId(id);
        t.setName("GST 18%");
        t.setRate(new BigDecimal("18"));
        return t;
    }

    private TaxRateDto change(String rate, boolean active) {
        TaxRateDto dto = new TaxRateDto();
        dto.setName("GST 18%");
        dto.setRate(new BigDecimal(rate));
        dto.setActive(active);
        return dto;
    }

    @Test
    void updateTaxRate_refusesToChangePercentage_ofARateUsedOnDocuments() {
        when(taxRateRepository.findById(id)).thenReturn(Optional.of(existing()));
        when(taxRateRepository.isUsedOnDocuments(id)).thenReturn(true);

        assertThatThrownBy(() -> taxRateService.updateTaxRate(id, change("12", true)))
                .isInstanceOf(ConflictException.class);
        verify(taxRateRepository, never()).save(any());
    }

    @Test
    void updateTaxRate_allowsDeactivating_aRateUsedOnDocuments() {
        TaxRate rate = existing();
        when(taxRateRepository.findById(id)).thenReturn(Optional.of(rate));
        when(taxRateRepository.save(rate)).thenReturn(rate);

        taxRateService.updateTaxRate(id, change("18", false));

        assertThat(rate.isActive()).isFalse();
        verify(taxRateRepository, never()).isUsedOnDocuments(any()); // percentage unchanged → no check needed
    }

    @Test
    void deleteTaxRate_refuses_whenUsedOnDocuments() {
        when(taxRateRepository.findById(id)).thenReturn(Optional.of(existing()));
        when(taxRateRepository.isUsedOnDocuments(id)).thenReturn(true);

        assertThatThrownBy(() -> taxRateService.deleteTaxRate(id)).isInstanceOf(ConflictException.class);
        verify(taxRateRepository, never()).delete(any());
    }

    @Test
    void taxRateDto_usesIsActiveInJson_bothWays() throws Exception {
        ObjectMapper json = new ObjectMapper();

        TaxRateDto parsed = json.readValue("{\"name\":\"GST 5%\",\"isActive\":false}", TaxRateDto.class);
        assertThat(parsed.isActive()).isFalse();

        String written = json.writeValueAsString(change("5", true));
        assertThat(written).contains("\"isActive\":true").doesNotContain("\"active\"");
    }
}
