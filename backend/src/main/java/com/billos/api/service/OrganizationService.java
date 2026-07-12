package com.billos.api.service;

import com.billos.api.dto.OrganizationSettingsDto;
import com.billos.api.entity.Organization;
import com.billos.api.entity.OrganizationSettings;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.repository.OrganizationRepository;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.UserRepository;
import com.billos.api.security.UserPrincipal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final UserRepository userRepository;
    private final AccountService accountService;
    private final WarehouseService warehouseService;

    @Transactional
    public Organization createOrganization(@NonNull Organization orgDetails) {
        // Get current user
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser =
                userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));

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

        // Seed default Organization Settings
        OrganizationSettings defaultSettings = new OrganizationSettings();
        defaultSettings.setOrganizationId(savedOrg.getId());
        organizationSettingsRepository.save(defaultSettings);

        return savedOrg;
    }

    @Transactional(readOnly = true)
    public List<Organization> getMyOrganizations() {
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<UserOrgRole> roles = userOrgRoleRepository.findByUserId(principal.getId());

        return roles.stream()
                .map(role -> organizationRepository
                        .findById(role.getOrganizationId())
                        .orElse(null))
                .filter(org -> org != null)
                .collect(Collectors.toList());
    }

    @Transactional
    public Organization updateOrganization(java.util.UUID id, Organization updatedDetails) {
        Organization org =
                organizationRepository.findById(id).orElseThrow(() -> new RuntimeException("Organization not found"));

        // Simple update logic
        if (updatedDetails.getName() != null) org.setName(updatedDetails.getName());
        if (updatedDetails.getLegalName() != null) org.setLegalName(updatedDetails.getLegalName());
        if (updatedDetails.getGstin() != null) org.setGstin(updatedDetails.getGstin());
        if (updatedDetails.getPhone() != null) org.setPhone(updatedDetails.getPhone());
        if (updatedDetails.getEmail() != null) org.setEmail(updatedDetails.getEmail());
        if (updatedDetails.getAddressLine1() != null) org.setAddressLine1(updatedDetails.getAddressLine1());
        if (updatedDetails.getAddressLine2() != null) org.setAddressLine2(updatedDetails.getAddressLine2());
        if (updatedDetails.getCity() != null) org.setCity(updatedDetails.getCity());
        if (updatedDetails.getState() != null) org.setState(updatedDetails.getState());
        if (updatedDetails.getPincode() != null) org.setPincode(updatedDetails.getPincode());

        return organizationRepository.save(org);
    }

    @Transactional(readOnly = true)
    public OrganizationSettingsDto getOrganizationSettings(UUID orgId) {
        OrganizationSettings settings = organizationSettingsRepository
                .findByOrganizationId(orgId)
                .orElseThrow(() -> new RuntimeException("Settings not found for organization"));

        return mapToDto(settings);
    }

    @Transactional
    public OrganizationSettingsDto updateOrganizationSettings(UUID orgId, OrganizationSettingsDto dto) {
        OrganizationSettings settings = organizationSettingsRepository
                .findByOrganizationId(orgId)
                .orElseThrow(() -> new RuntimeException("Settings not found for organization"));

        if (dto.getDefaultGstRate() != null) settings.setDefaultGstRate(dto.getDefaultGstRate());
        if (dto.getTaxInclusivePricing() != null) settings.setTaxInclusivePricing(dto.getTaxInclusivePricing());
        if (dto.getInvoicePrefix() != null) settings.setInvoicePrefix(dto.getInvoicePrefix());
        if (dto.getInvoiceNumberFormat() != null) settings.setInvoiceNumberFormat(dto.getInvoiceNumberFormat());
        if (dto.getInvoiceTerms() != null) settings.setInvoiceTerms(dto.getInvoiceTerms());
        if (dto.getBankDetails() != null) settings.setBankDetails(dto.getBankDetails());
        if (dto.getTheme() != null) settings.setTheme(dto.getTheme());
        if (dto.getLanguage() != null) settings.setLanguage(dto.getLanguage());
        if (dto.getTimezone() != null) settings.setTimezone(dto.getTimezone());
        if (dto.getDateFormat() != null) settings.setDateFormat(dto.getDateFormat());

        return mapToDto(organizationSettingsRepository.save(settings));
    }

    private OrganizationSettingsDto mapToDto(OrganizationSettings entity) {
        OrganizationSettingsDto dto = new OrganizationSettingsDto();
        dto.setId(entity.getId());
        dto.setOrganizationId(entity.getOrganizationId());
        dto.setDefaultGstRate(entity.getDefaultGstRate());
        dto.setTaxInclusivePricing(entity.getTaxInclusivePricing());
        dto.setInvoicePrefix(entity.getInvoicePrefix());
        dto.setInvoiceNumberFormat(entity.getInvoiceNumberFormat());
        dto.setInvoiceTerms(entity.getInvoiceTerms());
        dto.setBankDetails(entity.getBankDetails());
        dto.setTheme(entity.getTheme());
        dto.setLanguage(entity.getLanguage());
        dto.setTimezone(entity.getTimezone());
        dto.setDateFormat(entity.getDateFormat());
        return dto;
    }
}
