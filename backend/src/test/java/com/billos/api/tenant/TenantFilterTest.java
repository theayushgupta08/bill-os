package com.billos.api.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantFilterTest {

    @InjectMocks
    private TenantFilter tenantFilter;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should set tenant context from X-Organization-Id header")
    void shouldSetTenantFromHeader() throws Exception {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);
        String orgId = "550e8400-e29b-41d4-a716-446655440000";

        when(request.getHeader("X-Organization-Id")).thenReturn(orgId);

        // Capture the tenant value during doFilter
        doAnswer(invocation -> {
            assertThat(TenantContext.getCurrentTenant()).isEqualTo(orgId);
            return null;
        }).when(filterChain).doFilter(request, response);

        // Act
        tenantFilter.doFilterInternal(request, response, filterChain);

        // Assert - context should be cleared after filter completes
        assertThat(TenantContext.getCurrentTenant()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should proceed without tenant when header is missing")
    void shouldProceedWithoutTenantWhenHeaderMissing() throws Exception {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("X-Organization-Id")).thenReturn(null);

        // Act
        tenantFilter.doFilterInternal(request, response, filterChain);

        // Assert
        assertThat(TenantContext.getCurrentTenant()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should clear tenant context even if filter chain throws")
    void shouldClearContextOnException() throws Exception {
        // Arrange
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        when(request.getHeader("X-Organization-Id")).thenReturn("some-tenant");
        doThrow(new RuntimeException("Downstream error"))
                .when(filterChain).doFilter(request, response);

        // Act
        try {
            tenantFilter.doFilterInternal(request, response, filterChain);
        } catch (RuntimeException ignored) {
            // expected
        }

        // Assert - context MUST be cleaned up even after exception
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }
}
