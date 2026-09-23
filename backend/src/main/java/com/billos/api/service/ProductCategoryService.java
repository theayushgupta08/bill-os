package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.BulkImportResultDto;
import com.billos.api.dto.ProductCategoryDto;
import com.billos.api.entity.ProductCategory;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.ProductCategoryMapper;
import com.billos.api.repository.ProductCategoryRepository;
import com.billos.api.tenant.TenantContext;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        return productCategoryRepository
                .findById(id)
                .map(productCategoryMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory not found"));
    }

    @Transactional
    @Audited(entity = "ProductCategory", action = "CREATE")
    public ProductCategoryDto createCategory(ProductCategoryDto dto) {
        ProductCategory category = productCategoryMapper.toEntity(dto);
        category.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));

        if (dto.getParentId() != null) {
            ProductCategory parent = productCategoryRepository
                    .findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParent(parent);
        }

        ProductCategory savedCategory = productCategoryRepository.save(category);
        return productCategoryMapper.toDto(savedCategory);
    }

    @Transactional
    @Audited(entity = "ProductCategory", action = "BULK_IMPORT")
    public BulkImportResultDto bulkCreateCategories(List<ProductCategoryDto> dtos) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = UUID.fromString(currentTenant);

        BulkImportResultDto result = new BulkImportResultDto();
        result.setTotalCount(dtos.size());

        List<ProductCategory> categoriesToSave = new java.util.ArrayList<>();
        java.util.Set<String> seenNames = new java.util.HashSet<>();

        for (int i = 0; i < dtos.size(); i++) {
            ProductCategoryDto dto = dtos.get(i);
            int rowNum = i + 1;

            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum, "Row " + rowNum, "Category name is required"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }

            String name = dto.getName().trim();
            if (seenNames.contains(name.toLowerCase())
                    || productCategoryRepository.existsByOrganizationIdAndNameIgnoreCase(currentOrgId, name)) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum, name, "Category '" + name + "' already exists or is duplicated in file"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }
            seenNames.add(name.toLowerCase());

            ProductCategory category = productCategoryMapper.toEntity(dto);
            category.setName(name);
            category.setOrganizationId(currentOrgId);

            if (dto.getParentId() != null) {
                productCategoryRepository.findById(dto.getParentId()).ifPresent(category::setParent);
            }

            categoriesToSave.add(category);
        }

        if (!categoriesToSave.isEmpty()) {
            productCategoryRepository.saveAll(categoriesToSave);
            result.setInsertedCount(categoriesToSave.size());
        }

        return result;
    }

    @Transactional
    @Audited(entity = "ProductCategory", action = "UPDATE")
    public ProductCategoryDto updateCategory(UUID id, ProductCategoryDto dto) {
        ProductCategory existingCategory = productCategoryRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory not found"));

        productCategoryMapper.updateEntityFromDto(dto, existingCategory);

        if (dto.getParentId() != null) {
            ProductCategory parent = productCategoryRepository
                    .findById(dto.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            existingCategory.setParent(parent);
        } else {
            existingCategory.setParent(null);
        }

        ProductCategory updatedCategory = productCategoryRepository.save(existingCategory);
        return productCategoryMapper.toDto(updatedCategory);
    }

    @Transactional
    @Audited(entity = "ProductCategory", action = "DELETE")
    public void deleteCategory(UUID id) {
        ProductCategory category = productCategoryRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory not found"));
        productCategoryRepository.delete(category);
    }
}
