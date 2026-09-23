package com.billos.api.repository;

import com.billos.api.entity.Product;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByOrganizationId(UUID organizationId);

    @Query(
            "SELECT p FROM Product p WHERE p.organizationId = :currentOrgId OR (p.organizationId = :parentOrgId AND p.isShared = true)")
    List<Product> findAccessibleProducts(
            @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);

    @Query(
            "SELECT p FROM Product p WHERE p.id = :id AND (p.organizationId = :currentOrgId OR (p.organizationId = :parentOrgId AND p.isShared = true))")
    Optional<Product> findAccessibleById(
            @Param("id") UUID id, @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);

    Optional<Product> findByOrganizationIdAndSku(UUID organizationId, String sku);

    boolean existsByOrganizationIdAndSku(UUID organizationId, String sku);
}
