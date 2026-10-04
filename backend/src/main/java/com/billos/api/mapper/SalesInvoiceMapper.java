package com.billos.api.mapper;

import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.dto.SalesInvoiceLineDto;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SalesInvoiceMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "customer.name", target = "customerName")
    SalesInvoiceDto toDto(SalesInvoice salesInvoice);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "warehouse.id", target = "warehouseId")
    @Mapping(source = "warehouse.name", target = "warehouseName")
    @Mapping(source = "taxRate.id", target = "taxRateId")
    SalesInvoiceLineDto toDto(SalesInvoiceLine line);

    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "lines", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    SalesInvoice toEntity(SalesInvoiceDto dto);
}
