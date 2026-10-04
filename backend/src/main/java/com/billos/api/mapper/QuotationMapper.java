package com.billos.api.mapper;

import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.QuotationLineDto;
import com.billos.api.entity.Quotation;
import com.billos.api.entity.QuotationLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface QuotationMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.name", target = "customerName")
    QuotationDto toDto(Quotation quotation);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "taxRate.id", target = "taxRateId")
    QuotationLineDto toDto(QuotationLine line);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "lines", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    Quotation toEntity(QuotationDto dto);
}
