package com.billos.api.service;

import com.billos.api.entity.CollectionQrCode;
import com.billos.api.entity.Customer;
import com.billos.api.entity.Product;
import com.billos.api.repository.CollectionQrCodeRepository;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.ProductRepository;
import com.billos.api.tenant.TenantContext;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Tenant-safe lookups for {@link Customer}, {@link Product} and {@link CollectionQrCode}.
 *
 * <p>These entities dropped {@code @TenantId} (V020) so a branch can see records its parent marked as shared,
 * which means Hibernate no longer scopes them automatically and a plain {@code findById} crosses tenants.
 * Always resolve them through this class instead of the repository.
 */
@Service
@RequiredArgsConstructor
public class SharedEntityResolver {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CollectionQrCodeRepository qrCodeRepository;
    private final OrganizationService organizationService;

    public UUID currentOrgId() {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null) {
            throw new IllegalStateException("No active organization");
        }
        return UUID.fromString(tenant);
    }

    /** A customer owned by the current org, or shared by its parent — for referencing on documents. */
    public Customer accessibleCustomer(UUID id) {
        UUID orgId = currentOrgId();
        return customerRepository
                .findAccessibleById(id, orgId, organizationService.resolvePrimaryOrgId(orgId))
                .orElseThrow(() -> new RuntimeException("Customer not found"));
    }

    /** A product owned by the current org, or shared by its parent — for referencing on documents. */
    public Product accessibleProduct(UUID id) {
        UUID orgId = currentOrgId();
        return productRepository
                .findAccessibleById(id, orgId, organizationService.resolvePrimaryOrgId(orgId))
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    /** A QR code owned by the current org, or shared by its parent. */
    public CollectionQrCode accessibleQrCode(UUID id) {
        UUID orgId = currentOrgId();
        return qrCodeRepository
                .findAccessibleById(id, orgId, organizationService.resolvePrimaryOrgId(orgId))
                .orElseThrow(() -> new RuntimeException("QR Code not found"));
    }

    /** True when the record belongs to the current org itself (not inherited from the parent). */
    public boolean isOwnedByCurrentOrg(UUID recordOrgId) {
        return currentOrgId().equals(recordOrgId);
    }
}
