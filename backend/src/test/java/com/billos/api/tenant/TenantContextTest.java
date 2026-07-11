package com.billos.api.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should set and get current tenant")
    void shouldSetAndGetCurrentTenant() {
        // Arrange
        String tenantId = "550e8400-e29b-41d4-a716-446655440000";

        // Act
        TenantContext.setCurrentTenant(tenantId);

        // Assert
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(tenantId);
    }

    @Test
    @DisplayName("should return null when no tenant is set")
    void shouldReturnNullWhenNoTenantSet() {
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    @DisplayName("clear - should remove tenant from context")
    void clear_shouldRemoveTenant() {
        // Arrange
        TenantContext.setCurrentTenant("some-tenant-id");

        // Act
        TenantContext.clear();

        // Assert
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    @DisplayName("should isolate tenants across overwrites")
    void shouldOverwriteTenant() {
        // Arrange
        TenantContext.setCurrentTenant("tenant-1");

        // Act
        TenantContext.setCurrentTenant("tenant-2");

        // Assert
        assertThat(TenantContext.getCurrentTenant()).isEqualTo("tenant-2");
    }
}
