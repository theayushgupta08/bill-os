package com.billos.api.repository;

import com.billos.api.entity.ProductCategory;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
}
