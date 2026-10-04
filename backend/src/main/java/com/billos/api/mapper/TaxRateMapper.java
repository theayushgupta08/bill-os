package com.billos.api.mapper;

import com.billos.api.dto.TaxRateDto;
import com.billos.api.entity.TaxRate;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface TaxRateMapper {
    TaxRateDto toDto(TaxRate entity);

    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    TaxRate toEntity(TaxRateDto dto);
}
