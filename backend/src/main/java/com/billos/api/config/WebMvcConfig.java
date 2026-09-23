package com.billos.api.config;

import com.billos.api.security.RateLimitInterceptor;
import com.billos.api.security.TenantMembershipInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
@SuppressWarnings("null")
public class WebMvcConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;
    private final TenantMembershipInterceptor tenantMembershipInterceptor;

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // Rate limit first so rejected-tenant probing still consumes the caller's bucket.
        registry.addInterceptor(rateLimitInterceptor).addPathPatterns("/api/**");
        registry.addInterceptor(tenantMembershipInterceptor).addPathPatterns("/api/**");
    }
}
