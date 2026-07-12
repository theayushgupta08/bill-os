package com.billos.api.service;

import com.billos.api.dto.ProductCategoryDto;
import com.billos.api.entity.ProductCategory;
import com.billos.api.mapper.ProductCategoryMapper;
import com.billos.api.repository.ProductCategoryRepository;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProductCategoryService {

    private final ProductCategoryRepository productCategoryRepository;
    private final ProductCategoryMapper productCategoryMapper;

    @Transactional(readOnly = true)
    public List<ProductCategoryDto> getAllCategories() {
        return productCategoryRepository.findAll().stream()
                .map(productCategoryMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductCategoryDto getCategoryById(UUID id) {
        return productCategoryRepository.findById(id)
                .map(productCategoryMapper::toDto)
                .orElseThrow(() -> new RuntimeException("ProductCategory not found"));
    }

    @Transactional
    public ProductCategoryDto createCategory(ProductCategoryDto dto) {
        ProductCategory category = productCategoryMapper.toEntity(dto);
        category.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        
        if (dto.getParentId() != null) {
            ProductCategory parent = productCategoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            category.setParent(parent);
        }
        
        ProductCategory savedCategory = productCategoryRepository.save(category);
        return productCategoryMapper.toDto(savedCategory);
    }

    @Transactional
    public ProductCategoryDto updateCategory(UUID id, ProductCategoryDto dto) {
        ProductCategory existingCategory = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProductCategory not found"));
        
        productCategoryMapper.updateEntityFromDto(dto, existingCategory);
        
        if (dto.getParentId() != null) {
            ProductCategory parent = productCategoryRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            existingCategory.setParent(parent);
        } else {
            existingCategory.setParent(null);
        }
        
        ProductCategory updatedCategory = productCategoryRepository.save(existingCategory);
        return productCategoryMapper.toDto(updatedCategory);
    }

    @Transactional
    public void deleteCategory(UUID id) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProductCategory not found"));
        productCategoryRepository.delete(category);
    }
}
