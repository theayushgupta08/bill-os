package com.billos.api.mapper;

import com.billos.api.dto.WarehouseDto;
import com.billos.api.entity.Warehouse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface WarehouseMapper {
    WarehouseDto toDto(Warehouse entity);

    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    Warehouse toEntity(WarehouseDto dto);
}
