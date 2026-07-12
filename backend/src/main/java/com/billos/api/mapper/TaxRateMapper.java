package com.billos.api.mapper;

import com.billos.api.dto.TaxRateDto;
import com.billos.api.entity.TaxRate;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TaxRateMapper {
    TaxRateDto toDto(TaxRate entity);

    TaxRate toEntity(TaxRateDto dto);
}
