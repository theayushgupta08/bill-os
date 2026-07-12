package com.billos.api.mapper;

import com.billos.api.dto.SupplierDto;
import com.billos.api.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface SupplierMapper {
    SupplierDto toDto(Supplier supplier);
    Supplier toEntity(SupplierDto supplierDto);
    void updateEntityFromDto(SupplierDto dto, @MappingTarget Supplier entity);
}
