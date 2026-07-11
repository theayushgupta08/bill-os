package com.billos.api.mapper;

import com.billos.api.dto.SalesOrderDto;
import com.billos.api.dto.SalesOrderLineDto;
import com.billos.api.entity.SalesOrder;
import com.billos.api.entity.SalesOrderLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SalesOrderMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.name", target = "customerName")
    @Mapping(source = "quotation.id", target = "quoteId")
    SalesOrderDto toDto(SalesOrder salesOrder);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "taxRate.id", target = "taxRateId")
    SalesOrderLineDto toDto(SalesOrderLine line);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "quotation", ignore = true)
    @Mapping(target = "lines", ignore = true)
    SalesOrder toEntity(SalesOrderDto dto);
}
