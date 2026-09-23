package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.TaxRateDto;
import com.billos.api.entity.TaxRate;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.TaxRateMapper;
import com.billos.api.repository.TaxRateRepository;
import com.billos.api.tenant.TenantContext;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class TaxRateService {

    private final TaxRateRepository taxRateRepository;
    private final TaxRateMapper taxRateMapper;

    @Transactional(readOnly = true)
    public List<TaxRateDto> getAllTaxRates() {
        return taxRateRepository.findAll().stream().map(taxRateMapper::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxRateDto getTaxRateById(UUID id) {
        return taxRateRepository
                .findById(id)
                .map(taxRateMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));
    }

    @Transactional
    @Audited(entity = "TaxRate", action = "CREATE")
    public TaxRateDto createTaxRate(TaxRateDto dto) {
        TaxRate taxRate = taxRateMapper.toEntity(dto);
        taxRate.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        TaxRate saved = taxRateRepository.save(taxRate);
        return taxRateMapper.toDto(saved);
    }

    @Transactional
    @Audited(entity = "TaxRate", action = "UPDATE")
    public TaxRateDto updateTaxRate(UUID id, TaxRateDto dto) {
        TaxRate existing =
                taxRateRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));

        // Documents show their linked rate, so once a rate is in use its percentage is frozen — changing it would
        // misstate historical invoices. Create a new rate and deactivate this one instead.
        if (dto.getRate() != null
                && existing.getRate().compareTo(dto.getRate()) != 0
                && taxRateRepository.isUsedOnDocuments(id)) {
            throw new ConflictException("Tax rate " + existing.getName()
                    + " is used on documents, so its percentage can't change. Add a new rate and deactivate this one.");
        }
        if (dto.getName() != null && !dto.getName().isBlank()) existing.setName(dto.getName());
        if (dto.getRate() != null) existing.setRate(dto.getRate());
        existing.setActive(dto.isActive());

        TaxRate updated = taxRateRepository.save(existing);
        return taxRateMapper.toDto(updated);
    }

    @Transactional
    @Audited(entity = "TaxRate", action = "DELETE")
    public void deleteTaxRate(UUID id) {
        TaxRate existing =
                taxRateRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));
        // Soft delete would leave document lines pointing at a hidden rate
        if (taxRateRepository.isUsedOnDocuments(id)) {
            throw new ConflictException(
                    "Tax rate " + existing.getName() + " is used on documents; deactivate it instead of deleting");
        }
        taxRateRepository.delete(existing);
    }
}
