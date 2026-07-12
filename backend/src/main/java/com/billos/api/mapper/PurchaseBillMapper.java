package com.billos.api.mapper;

import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.PurchaseBillLineDto;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PurchaseBillMapper {

    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    @Mapping(source = "purchaseOrder.id", target = "poId")
    @Mapping(source = "purchaseOrder.poNumber", target = "poNumber")
    PurchaseBillDto toDto(PurchaseBill entity);

    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "warehouse.id", target = "warehouseId")
    @Mapping(source = "warehouse.name", target = "warehouseName")
    @Mapping(source = "taxRate.id", target = "taxRateId")
    @Mapping(source = "taxRate.name", target = "taxRateName")
    @Mapping(source = "taxRate.rate", target = "taxRate")
    PurchaseBillLineDto toLineDto(PurchaseBillLine entity);
}
