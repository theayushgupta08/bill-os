package com.billos.api.tenant;

import java.util.UUID;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID> {

    // Default tenant for entities that don't specify one, or when no context is set.
    private static final UUID DEFAULT_TENANT = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Override
    public UUID resolveCurrentTenantIdentifier() {
        String currentTenant = TenantContext.getCurrentTenant();
        if (StringUtils.hasText(currentTenant)) {
            try {
                return UUID.fromString(currentTenant);
            } catch (IllegalArgumentException e) {
                return DEFAULT_TENANT;
            }
        }
        return DEFAULT_TENANT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
