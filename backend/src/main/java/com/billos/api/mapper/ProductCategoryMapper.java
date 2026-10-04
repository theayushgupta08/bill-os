package com.billos.api.mapper;

import com.billos.api.dto.ProductCategoryDto;
import com.billos.api.entity.ProductCategory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface ProductCategoryMapper {

    @Mapping(source = "parent.id", target = "parentId")
    ProductCategoryDto toDto(ProductCategory category);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    ProductCategory toEntity(ProductCategoryDto dto);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    void updateEntityFromDto(ProductCategoryDto dto, @MappingTarget ProductCategory entity);
}
