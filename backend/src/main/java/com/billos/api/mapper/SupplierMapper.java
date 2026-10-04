package com.billos.api.mapper;

import com.billos.api.dto.SupplierDto;
import com.billos.api.entity.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface SupplierMapper {
    SupplierDto toDto(Supplier supplier);

    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    Supplier toEntity(SupplierDto supplierDto);

    @org.mapstruct.Mapping(target = "outstandingBalance", ignore = true)
    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    void updateEntityFromDto(SupplierDto dto, @MappingTarget Supplier entity);
}
