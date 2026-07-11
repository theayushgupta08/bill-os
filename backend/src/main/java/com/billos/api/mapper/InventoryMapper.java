package com.billos.api.mapper;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.StockMovementDto;
import com.billos.api.entity.InventoryLevel;
import com.billos.api.entity.StockMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InventoryMapper {

    @Mapping(source = "warehouse.id", target = "warehouseId")
    @Mapping(source = "warehouse.name", target = "warehouseName")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.sku", target = "productCode")
    InventoryLevelDto toLevelDto(InventoryLevel entity);

    @Mapping(source = "warehouse.id", target = "warehouseId")
    @Mapping(source = "warehouse.name", target = "warehouseName")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    StockMovementDto toMovementDto(StockMovement entity);
}
