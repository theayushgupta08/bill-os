package com.billos.api.service;

import com.billos.api.dto.TaxRateDto;
import com.billos.api.entity.TaxRate;
import com.billos.api.mapper.TaxRateMapper;
import com.billos.api.repository.TaxRateRepository;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;
    private final TaxRateMapper taxRateMapper;

    @Transactional(readOnly = true)
    public List<TaxRateDto> getAllTaxRates() {
        return taxRateRepository.findAll().stream()
                .map(taxRateMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxRateDto getTaxRateById(UUID id) {
        return taxRateRepository.findById(id)
                .map(taxRateMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Tax Rate not found"));
    }

    @Transactional
    public TaxRateDto createTaxRate(TaxRateDto dto) {
        TaxRate taxRate = taxRateMapper.toEntity(dto);
        taxRate.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        TaxRate saved = taxRateRepository.save(taxRate);
        return taxRateMapper.toDto(saved);
    }

    @Transactional
    public TaxRateDto updateTaxRate(UUID id, TaxRateDto dto) {
        TaxRate existing = taxRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tax Rate not found"));
        
        existing.setName(dto.getName());
        existing.setRate(dto.getRate());
        existing.setActive(dto.isActive());
        
        TaxRate updated = taxRateRepository.save(existing);
        return taxRateMapper.toDto(updated);
    }

    @Transactional
    public void deleteTaxRate(UUID id) {
        taxRateRepository.deleteById(id);
    }
}
