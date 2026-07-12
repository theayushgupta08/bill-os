package com.billos.api.service;

import com.billos.api.dto.WarehouseDto;
import com.billos.api.entity.Warehouse;
import com.billos.api.mapper.WarehouseMapper;
import com.billos.api.repository.WarehouseRepository;
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
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final WarehouseMapper warehouseMapper;

    @Transactional(readOnly = true)
    public List<WarehouseDto> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(warehouseMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseDto getWarehouseById(UUID id) {
        return warehouseRepository.findById(id)
                .map(warehouseMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
    }

    @Transactional
    public WarehouseDto createWarehouse(WarehouseDto dto) {
        Warehouse warehouse = warehouseMapper.toEntity(dto);
        warehouse.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        Warehouse saved = warehouseRepository.save(warehouse);
        return warehouseMapper.toDto(saved);
    }

    @Transactional
    public WarehouseDto updateWarehouse(UUID id, WarehouseDto dto) {
        Warehouse existing = warehouseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Warehouse not found"));
        
        existing.setName(dto.getName());
        existing.setCode(dto.getCode());
        existing.setAddressLine1(dto.getAddressLine1());
        existing.setAddressLine2(dto.getAddressLine2());
        existing.setCity(dto.getCity());
        existing.setState(dto.getState());
        existing.setPincode(dto.getPincode());
        existing.setActive(dto.isActive());
        
        Warehouse updated = warehouseRepository.save(existing);
        return warehouseMapper.toDto(updated);
    }

    @Transactional
    public void deleteWarehouse(UUID id) {
        warehouseRepository.deleteById(id);
    }

    @Transactional
    public void seedDefaultWarehouse(UUID organizationId) {
        Warehouse defaultWarehouse = new Warehouse();
        defaultWarehouse.setOrganizationId(organizationId);
        defaultWarehouse.setName("Main Warehouse");
        defaultWarehouse.setCode("MAIN");
        defaultWarehouse.setActive(true);
        warehouseRepository.save(defaultWarehouse);
    }
}
