package com.billos.api.service;

import com.billos.api.entity.Organization;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;

import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final UserRepository userRepository;
    private final AccountService accountService;
    private final WarehouseService warehouseService;

    @Transactional
    public Organization createOrganization(@NonNull Organization orgDetails) {
        // Get current user
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Save Organization
        Organization savedOrg = organizationRepository.save(orgDetails);

        // Assign OWNER role to the creator
        UserOrgRole userOrgRole = new UserOrgRole();
        userOrgRole.setUser(currentUser);
        userOrgRole.setOrganizationId(savedOrg.getId());
        userOrgRole.setRole("OWNER");
        userOrgRoleRepository.save(userOrgRole);

        // Seed default Chart of Accounts for the new organization
        accountService.seedDefaultAccounts(savedOrg.getId());

        // Seed default Main Warehouse
        warehouseService.seedDefaultWarehouse(savedOrg.getId());

        return savedOrg;
    }

    @Transactional(readOnly = true)
    public List<Organization> getMyOrganizations() {
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        List<UserOrgRole> roles = userOrgRoleRepository.findByUserId(principal.getId());
        
        return roles.stream()
                .map(role -> organizationRepository.findById(role.getOrganizationId()).orElse(null))
                .filter(org -> org != null)
                .collect(Collectors.toList());
    }
}
