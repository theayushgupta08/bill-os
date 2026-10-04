package com.billos.api.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.billos.api.dto.CustomerDto;
import com.billos.api.dto.JournalEntryLineDto;
import com.billos.api.dto.ProductDto;
import com.billos.api.dto.SupplierDto;
import com.billos.api.entity.Customer;
import com.billos.api.entity.JournalEntryLine;
import com.billos.api.entity.Product;
import com.billos.api.entity.Supplier;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/**
 * Request DTOs must never decide a row's identity or owner. Runs the generated MapStruct code itself, because the
 * protection lives in mapper annotations, not in service logic a mock could stand in for.
 *
 * <p>Regression: create mapped the client's {@code id}, so {@code save()} merged over an existing row — for
 * customers and products (no {@code @TenantId}) that row could belong to another organization. Update also copied
 * {@code organizationId}, letting a caller move their record into someone else's organization.
 */
class RequestFieldMappingTest {

    private final UUID foreignId = UUID.randomUUID();
    private final UUID foreignOrg = UUID.randomUUID();

    @Test
    void customerCreate_shouldIgnoreClientIdAndOwnership() {
        CustomerDto dto = new CustomerDto();
        dto.setId(foreignId);
        dto.setOrganizationId(foreignOrg);
        dto.setOriginatingOrgId(foreignOrg);
        dto.setName("Sharma Traders");

        Customer customer = new CustomerMapperImpl().toEntity(dto);

        assertThat(customer.getId()).isNull();
        assertThat(customer.getOrganizationId()).isNull();
        assertThat(customer.getOriginatingOrgId()).isNull();
        assertThat(customer.getName()).isEqualTo("Sharma Traders");
    }

    @Test
    void customerUpdate_shouldNotChangeIdentityOrOwner() {
        UUID id = UUID.randomUUID();
        UUID owner = UUID.randomUUID();
        Customer existing = new Customer();
        existing.setId(id);
        existing.setOrganizationId(owner);
        existing.setOriginatingOrgId(owner);
        CustomerDto dto = new CustomerDto();
        dto.setId(foreignId);
        dto.setOrganizationId(foreignOrg);
        dto.setOriginatingOrgId(foreignOrg);
        dto.setName("Renamed");
        dto.setIsShared(false);

        new CustomerMapperImpl().updateEntityFromDto(dto, existing);

        assertThat(existing.getId()).isEqualTo(id);
        assertThat(existing.getOrganizationId()).isEqualTo(owner);
        assertThat(existing.getOriginatingOrgId()).isEqualTo(owner);
        assertThat(existing.getName()).isEqualTo("Renamed");
        assertThat(existing.getIsShared()).isFalse(); // the owner may still choose what to share
    }

    @Test
    void productCreateAndUpdate_shouldIgnoreClientIdAndOwnership() {
        ProductDto dto = new ProductDto();
        dto.setId(foreignId);
        dto.setOrganizationId(foreignOrg);
        dto.setName("LED panel 18 W");

        Product created = new ProductMapperImpl().toEntity(dto);
        assertThat(created.getId()).isNull();
        assertThat(created.getOrganizationId()).isNull();

        UUID id = UUID.randomUUID();
        UUID owner = UUID.randomUUID();
        Product existing = new Product();
        existing.setId(id);
        existing.setOrganizationId(owner);
        new ProductMapperImpl().updateEntityFromDto(dto, existing);
        assertThat(existing.getId()).isEqualTo(id);
        assertThat(existing.getOrganizationId()).isEqualTo(owner);
    }

    @Test
    void supplierCreateAndUpdate_shouldIgnoreClientId() {
        SupplierDto dto = new SupplierDto();
        dto.setId(foreignId);
        dto.setName("Deccan Wires");

        assertThat(new SupplierMapperImpl().toEntity(dto).getId()).isNull();

        UUID id = UUID.randomUUID();
        Supplier existing = new Supplier();
        existing.setId(id);
        new SupplierMapperImpl().updateEntityFromDto(dto, existing);
        assertThat(existing.getId()).isEqualTo(id);
    }

    @Test
    void journalLine_shouldIgnoreClientId() {
        // Lines have no organization column; a client line id would let a cascade re-parent another tenant's line
        JournalEntryLineDto dto = new JournalEntryLineDto();
        dto.setId(foreignId);

        JournalEntryLine line = new JournalEntryMapperImpl().lineToEntity(dto);

        assertThat(line.getId()).isNull();
    }
}
