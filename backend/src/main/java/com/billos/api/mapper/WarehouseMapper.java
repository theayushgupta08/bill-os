package com.billos.api.mapper;

import com.billos.api.dto.WarehouseDto;
import com.billos.api.entity.Warehouse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface WarehouseMapper {
    WarehouseDto toDto(Warehouse entity);

    Warehouse toEntity(WarehouseDto dto);
}
