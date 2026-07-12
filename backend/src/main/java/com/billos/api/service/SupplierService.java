package com.billos.api.service;

import com.billos.api.dto.SupplierDto;
import com.billos.api.entity.Supplier;
import com.billos.api.mapper.SupplierMapper;
import com.billos.api.repository.SupplierRepository;
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
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    @Transactional(readOnly = true)
    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream().map(supplierMapper::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SupplierDto getSupplierById(UUID id) {
        return supplierRepository
                .findById(id)
                .map(supplierMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    @Transactional
    public SupplierDto createSupplier(SupplierDto supplierDto) {
        Supplier supplier = supplierMapper.toEntity(supplierDto);
        supplier.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        Supplier savedSupplier = supplierRepository.save(supplier);
        return supplierMapper.toDto(savedSupplier);
    }

    @Transactional
    public SupplierDto updateSupplier(UUID id, SupplierDto supplierDto) {
        Supplier existingSupplier =
                supplierRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));

        supplierMapper.updateEntityFromDto(supplierDto, existingSupplier);
        Supplier updatedSupplier = supplierRepository.save(existingSupplier);
        return supplierMapper.toDto(updatedSupplier);
    }

    @Transactional
    public void deleteSupplier(UUID id) {
        Supplier supplier =
                supplierRepository.findById(id).orElseThrow(() -> new RuntimeException("Supplier not found"));
        supplierRepository.delete(supplier);
    }
}
