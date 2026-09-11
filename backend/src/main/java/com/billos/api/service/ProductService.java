package com.billos.api.service;

import com.billos.api.dto.BulkImportResultDto;
import com.billos.api.dto.ProductDto;
import com.billos.api.entity.Product;
import com.billos.api.entity.ProductCategory;
import com.billos.api.mapper.ProductMapper;
import com.billos.api.repository.ProductCategoryRepository;
import com.billos.api.repository.ProductRepository;
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
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductMapper productMapper;
    private final OrganizationService organizationService;

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts() {
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            return java.util.Collections.emptyList();
        }
        UUID currentOrgId = UUID.fromString(currentTenant);
        UUID primaryOrgId = organizationService.resolvePrimaryOrgId(currentOrgId);

        List<Product> products = productRepository.findAccessibleProducts(currentOrgId, primaryOrgId);

        return products.stream()
                .map(p -> {
                    ProductDto dto = productMapper.toDto(p);
                    boolean isMasterShared = !p.getOrganizationId().equals(currentOrgId);
                    dto.setIsMasterShared(isMasterShared);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDto getProductById(UUID id) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = currentTenant != null ? UUID.fromString(currentTenant) : null;
        UUID primaryOrgId = currentOrgId != null ? organizationService.resolvePrimaryOrgId(currentOrgId) : null;

        Product product = (currentOrgId != null && primaryOrgId != null)
                ? productRepository
                        .findAccessibleById(id, currentOrgId, primaryOrgId)
                        .orElseThrow(() -> new RuntimeException("Product not found"))
                : productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));

        ProductDto dto = productMapper.toDto(product);
        if (currentOrgId != null) {
            dto.setIsMasterShared(!product.getOrganizationId().equals(currentOrgId));
        }
        return dto;
    }

    @Transactional
    public ProductDto createProduct(ProductDto dto) {
        Product product = productMapper.toEntity(dto);
        product.setOrganizationId(UUID.fromString(TenantContext.getCurrentTenant()));
        if (dto.getIsShared() != null) {
            product.setIsShared(dto.getIsShared());
        } else {
            product.setIsShared(true);
        }

        if (dto.getCategoryId() != null) {
            ProductCategory category = productCategoryRepository
                    .findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            product.setCategory(category);
        }

        Product savedProduct = productRepository.save(product);
        return productMapper.toDto(savedProduct);
    }

    @Transactional
    public BulkImportResultDto bulkCreateProducts(List<ProductDto> dtos) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = UUID.fromString(currentTenant);

        BulkImportResultDto result = new BulkImportResultDto();
        result.setTotalCount(dtos.size());

        List<Product> productsToSave = new java.util.ArrayList<>();
        java.util.Set<String> seenSkus = new java.util.HashSet<>();

        for (int i = 0; i < dtos.size(); i++) {
            ProductDto dto = dtos.get(i);
            int rowNum = i + 1;

            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum,
                                dto.getSku() != null ? dto.getSku() : "Row " + rowNum,
                                "Product name is required"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }

            if (dto.getSku() == null || dto.getSku().trim().isEmpty()) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum, dto.getName(), "Product SKU is required"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }

            String sku = dto.getSku().trim();
            if (seenSkus.contains(sku.toLowerCase())
                    || productRepository.existsByOrganizationIdAndSku(currentOrgId, sku)) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum, sku, "SKU '" + sku + "' already exists or is duplicated in file"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }
            seenSkus.add(sku.toLowerCase());

            Product product = productMapper.toEntity(dto);
            product.setSku(sku);
            product.setOrganizationId(currentOrgId);
            product.setIsShared(dto.getIsShared() != null ? dto.getIsShared() : true);
            if (product.getBasePrice() == null) {
                product.setBasePrice(java.math.BigDecimal.ZERO);
            }
            if (product.getTaxRate() == null) {
                product.setTaxRate(java.math.BigDecimal.ZERO);
            }

            if (dto.getCategoryId() != null) {
                productCategoryRepository.findById(dto.getCategoryId()).ifPresent(product::setCategory);
            }

            productsToSave.add(product);
        }

        if (!productsToSave.isEmpty()) {
            productRepository.saveAll(productsToSave);
            result.setInsertedCount(productsToSave.size());
        }

        return result;
    }

    @Transactional
    public ProductDto updateProduct(UUID id, ProductDto dto) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = UUID.fromString(currentTenant);

        Product existingProduct =
                productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));

        // Fixed price enforcement: Secondary organizations cannot alter master product pricing
        if (!existingProduct.getOrganizationId().equals(currentOrgId)) {
            throw new RuntimeException(
                    "Branch cannot modify master products owned by the Primary Organization. Product prices are fixed to the Primary Master Price.");
        }

        productMapper.updateEntityFromDto(dto, existingProduct);

        if (dto.getCategoryId() != null) {
            ProductCategory category = productCategoryRepository
                    .findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            existingProduct.setCategory(category);
        } else {
            existingProduct.setCategory(null);
        }

        Product updatedProduct = productRepository.save(existingProduct);
        return productMapper.toDto(updatedProduct);
    }

    @Transactional
    public void deleteProduct(UUID id) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = UUID.fromString(currentTenant);

        Product product = productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getOrganizationId().equals(currentOrgId)) {
            throw new RuntimeException("Branch cannot delete master products owned by the Primary Organization.");
        }

        productRepository.delete(product);
    }
}
