package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.billos.api.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class TenantMembershipInterceptorTest {

    @Mock
    private TenantSecurity tenantSecurity;

    private TenantMembershipInterceptor interceptor;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        interceptor = new TenantMembershipInterceptor(tenantSecurity, new ObjectMapper());
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldAllowRequest_whenCallerIsMemberOfHeaderOrg() throws Exception {
        UUID orgId = UUID.randomUUID();
        TenantContext.setCurrentTenant(orgId.toString());
        when(tenantSecurity.isMemberOf(orgId)).thenReturn(true);

        boolean proceed =
                interceptor.preHandle(new MockHttpServletRequest("GET", "/api/v1/customers"), response, new Object());

        assertThat(proceed).isTrue();
    }

    @Test
    void shouldReturn403_whenCallerIsNotMemberOfHeaderOrg() throws Exception {
        UUID orgId = UUID.randomUUID();
        TenantContext.setCurrentTenant(orgId.toString());
        when(tenantSecurity.isMemberOf(orgId)).thenReturn(false);

        boolean proceed =
                interceptor.preHandle(new MockHttpServletRequest("GET", "/api/v1/customers"), response, new Object());

        assertThat(proceed).isFalse();
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("do not have access");
    }

    @Test
    void shouldReturn400_whenHeaderMissingOnTenantScopedPath() throws Exception {
        boolean proceed = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/v1/sales-invoices"), response, new Object());

        assertThat(proceed).isFalse();
        assertThat(response.getStatus()).isEqualTo(400);
        verifyNoInteractions(tenantSecurity);
    }

    @Test
    void shouldReturn400_whenHeaderIsNotAUuid() throws Exception {
        TenantContext.setCurrentTenant("not-a-uuid");

        boolean proceed =
                interceptor.preHandle(new MockHttpServletRequest("GET", "/api/v1/products"), response, new Object());

        assertThat(proceed).isFalse();
        assertThat(response.getStatus()).isEqualTo(400);
    }

    @Test
    void shouldSkipCheck_whenPathIsTenantAgnostic() throws Exception {
        for (String path : new String[] {
            "/api/v1/users/me", "/api/v1/organizations", "/api/v1/organizations/tree", "/api/v1/public/check-suffix"
        }) {
            assertThat(interceptor.preHandle(new MockHttpServletRequest("GET", path), response, new Object()))
                    .as(path)
                    .isTrue();
        }
        verifyNoInteractions(tenantSecurity);
    }

    @Test
    void shouldDropForgedHeader_onTenantAgnosticPath() throws Exception {
        // These routes still run with whatever tenant the header names; a caller naming an organization they
        // don't belong to must end up with no tenant at all, not that organization's.
        UUID foreignOrg = UUID.randomUUID();
        TenantContext.setCurrentTenant(foreignOrg.toString());
        when(tenantSecurity.isMemberOf(foreignOrg)).thenReturn(false);

        boolean proceed = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/v1/organizations/tree"), response, new Object());

        assertThat(proceed).isTrue();
        assertThat(TenantContext.getCurrentTenant()).isNull();
    }

    @Test
    void shouldKeepMembersHeader_onTenantAgnosticPath() throws Exception {
        UUID orgId = UUID.randomUUID();
        TenantContext.setCurrentTenant(orgId.toString());
        when(tenantSecurity.isMemberOf(orgId)).thenReturn(true);

        boolean proceed =
                interceptor.preHandle(new MockHttpServletRequest("PUT", "/api/v1/users/me"), response, new Object());

        assertThat(proceed).isTrue();
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(orgId.toString());
    }

    @Test
    void shouldNotTreatSimilarPrefixAsTenantAgnostic() throws Exception {
        boolean proceed = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/v1/usersettings"), response, new Object());

        assertThat(proceed).isFalse();
        assertThat(response.getStatus()).isEqualTo(400);
    }

    @Test
    void shouldAllowPreflight_withoutTenant() throws Exception {
        boolean proceed = interceptor.preHandle(
                new MockHttpServletRequest("OPTIONS", "/api/v1/customers"), response, new Object());

        assertThat(proceed).isTrue();
    }
}
