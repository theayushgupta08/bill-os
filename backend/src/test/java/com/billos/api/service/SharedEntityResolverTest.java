package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import com.billos.api.entity.Customer;
import com.billos.api.repository.CollectionQrCodeRepository;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.ProductRepository;
import com.billos.api.tenant.TenantContext;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SharedEntityResolverTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CollectionQrCodeRepository qrCodeRepository;

    @Mock
    private OrganizationService organizationService;

    @InjectMocks
    private SharedEntityResolver resolver;

    private final UUID branchId = UUID.randomUUID();
    private final UUID parentId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(branchId.toString());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldScopeCustomerLookupToCurrentOrgAndParent() {
        UUID customerId = UUID.randomUUID();
        Customer customer = new Customer();
        when(organizationService.resolvePrimaryOrgId(branchId)).thenReturn(parentId);
        when(customerRepository.findAccessibleById(customerId, branchId, parentId))
                .thenReturn(Optional.of(customer));

        assertThat(resolver.accessibleCustomer(customerId)).isSameAs(customer);
        verify(customerRepository, never()).findById(any());
    }

    @Test
    void shouldThrowNotFound_whenProductBelongsToAnotherTenant() {
        UUID productId = UUID.randomUUID();
        when(organizationService.resolvePrimaryOrgId(branchId)).thenReturn(parentId);
        when(productRepository.findAccessibleById(productId, branchId, parentId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> resolver.accessibleProduct(productId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void shouldReportOwnership_onlyForCurrentOrg() {
        assertThat(resolver.isOwnedByCurrentOrg(branchId)).isTrue();
        assertThat(resolver.isOwnedByCurrentOrg(parentId)).isFalse();
    }

    @Test
    void shouldThrow_whenNoActiveOrganization() {
        TenantContext.clear();

        assertThatThrownBy(() -> resolver.accessibleProduct(UUID.randomUUID()))
                .isInstanceOf(com.billos.api.exception.BadRequestException.class);
        verifyNoInteractions(productRepository);
    }
}
