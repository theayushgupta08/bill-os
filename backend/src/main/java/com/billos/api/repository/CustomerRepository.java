package com.billos.api.repository;

import com.billos.api.entity.Customer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    List<Customer> findByOrganizationId(UUID organizationId);

    @Query(
            "SELECT c FROM Customer c WHERE c.organizationId = :currentOrgId OR (c.organizationId = :parentOrgId AND c.isShared = true)")
    List<Customer> findAccessibleCustomers(
            @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);

    @Query(
            "SELECT c FROM Customer c WHERE c.id = :id AND (c.organizationId = :currentOrgId OR c.organizationId = :parentOrgId)")
    Optional<Customer> findAccessibleById(
            @Param("id") UUID id, @Param("currentOrgId") UUID currentOrgId, @Param("parentOrgId") UUID parentOrgId);

    boolean existsByOrganizationIdAndPhone(UUID organizationId, String phone);
}
