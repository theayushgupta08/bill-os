package com.billos.api.mapper;

import com.billos.api.dto.ProductDto;
import com.billos.api.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface ProductMapper {

    @Mapping(source = "category.id", target = "categoryId")
    ProductDto toDto(Product product);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "costPrice", ignore = true) // maintained from purchases, never set by clients
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    @Mapping(target = "organizationId", ignore = true)
    Product toEntity(ProductDto dto);

    @Mapping(target = "category", ignore = true)
    @Mapping(target = "costPrice", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    @Mapping(target = "organizationId", ignore = true)
    void updateEntityFromDto(ProductDto dto, @MappingTarget Product entity);
}
