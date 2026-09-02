package com.billos.api.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.billos.api.entity.User;
import com.billos.api.service.SupabaseUserProvisioningService;
import jakarta.servlet.FilterChain;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private SupabaseUserProvisioningService userProvisioningService;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private SupabaseIdentity identity() {
        return new SupabaseIdentity(UUID.randomUUID(), "ada@example.com", "Ada", "Lovelace", null);
    }

    private User activeUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("ada@example.com");
        user.setIsActive(true);
        return user;
    }

    @Test
    @DisplayName("should authenticate and continue the chain for a valid bearer token")
    void shouldAuthenticate_whenTokenValid() throws Exception {
        User user = activeUser();
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtTokenProvider.toIdentity("good-token")).thenReturn(identity());
        when(userProvisioningService.resolveUser(any())).thenReturn(user);

        filter.doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getPrincipal()).isInstanceOf(UserPrincipal.class);
        assertThat(((UserPrincipal) auth.getPrincipal()).getId()).isEqualTo(user.getId());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should leave the context empty and continue when no Authorization header is present")
    void shouldSkip_whenNoHeader() throws Exception {
        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userProvisioningService, never()).resolveUser(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should ignore an Authorization header that is not a bearer token")
    void shouldSkip_whenNotBearer() throws Exception {
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should not provision a user when the token is rejected")
    void shouldNotProvision_whenTokenRejected() throws Exception {
        request.addHeader("Authorization", "Bearer bad-token");
        when(jwtTokenProvider.toIdentity("bad-token")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userProvisioningService, never()).resolveUser(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should refuse to authenticate a deactivated user holding a valid token")
    void shouldNotAuthenticate_whenUserDeactivated() throws Exception {
        User user = activeUser();
        user.setIsActive(false);
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtTokenProvider.toIdentity("good-token")).thenReturn(identity());
        when(userProvisioningService.resolveUser(any())).thenReturn(user);

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should continue the chain unauthenticated when provisioning blows up")
    void shouldContinueUnauthenticated_whenProvisioningFails() throws Exception {
        request.addHeader("Authorization", "Bearer good-token");
        when(jwtTokenProvider.toIdentity("good-token")).thenReturn(identity());
        when(userProvisioningService.resolveUser(any())).thenThrow(new RuntimeException("db down"));

        filter.doFilter(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }
}
