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
    ProductCategory toEntity(ProductCategoryDto dto);
    
    @Mapping(target = "parent", ignore = true)
    void updateEntityFromDto(ProductCategoryDto dto, @MappingTarget ProductCategory entity);
}
