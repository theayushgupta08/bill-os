package com.billos.api.security;

import com.billos.api.entity.User;
import com.billos.api.service.SupabaseUserProvisioningService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Authenticates requests carrying a Supabase Auth access token.
 *
 * <p>Never rejects a request itself — an unauthenticated request simply passes through with an
 * empty {@link SecurityContextHolder}, and the authorization rules in {@link SecurityConfig} decide
 * whether that is acceptable.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider jwtTokenProvider;
    private final SupabaseUserProvisioningService userProvisioningService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String token = getTokenFromRequest(request);
        if (StringUtils.hasText(token)) {
            authenticate(token, request);
        }

        filterChain.doFilter(request, response);
    }

    private void authenticate(String token, HttpServletRequest request) {
        SupabaseIdentity identity = jwtTokenProvider.toIdentity(token);
        if (identity == null) {
            return; // Already logged by the provider.
        }

        User user;
        try {
            user = userProvisioningService.resolveUser(identity);
        } catch (RuntimeException ex) {
            log.error("Failed to provision local user for Supabase id {}", identity.supabaseId(), ex);
            return;
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            log.warn("Rejected token for deactivated user {}", user.getId());
            return;
        }

        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length());
        }
        return null;
    }
}
