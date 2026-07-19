package com.billos.api.service;

import com.billos.api.entity.OrganizationSettings;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrganizationSeeder {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final AccountService accountService;
    private final WarehouseService warehouseService;
    private final OrganizationSettingsRepository organizationSettingsRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void seedNewOrganization(UUID orgId, User currentUser) {
        UserOrgRole userOrgRole = new UserOrgRole();
        userOrgRole.setUser(currentUser);
        userOrgRole.setOrganizationId(orgId);
        userOrgRole.setRole("OWNER");
        userOrgRoleRepository.save(userOrgRole);

        accountService.seedDefaultAccounts(orgId);
        warehouseService.seedDefaultWarehouse(orgId);

        OrganizationSettings defaultSettings = new OrganizationSettings();
        defaultSettings.setOrganizationId(orgId);
        organizationSettingsRepository.save(defaultSettings);
    }
}
