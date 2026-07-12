package com.billos.api.mapper;

import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.PurchaseOrderLineDto;
import com.billos.api.entity.PurchaseOrder;
import com.billos.api.entity.PurchaseOrderLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface PurchaseOrderMapper {

    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    PurchaseOrderDto toDto(PurchaseOrder entity);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "taxRate.id", target = "taxRateId")
    @Mapping(source = "taxRate.name", target = "taxRateName")
    @Mapping(source = "taxRate.rate", target = "taxRate")
    PurchaseOrderLineDto toLineDto(PurchaseOrderLine entity);
}
