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
    private final OrganizationSeeder organizationSeeder;

    // Removed @Transactional so that the Organization is committed before the seeder starts
    public Organization createOrganization(@NonNull Organization orgDetails) {
        // Get current user
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser =
                userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        if (orgDetails.getParentOrganizationId() == null) {
            orgDetails.setIsPrimary(true);
        } else if (orgDetails.getIsPrimary() == null) {
            orgDetails.setIsPrimary(false);
        }
        orgDetails.setCreatedBy(currentUser.getId());

        // Save and flush Organization immediately so it's visible to the seeder's new transaction
        Organization savedOrg = organizationRepository.saveAndFlush(orgDetails);

        String previousTenant = com.billos.api.tenant.TenantContext.getCurrentTenant();
        try {
            com.billos.api.tenant.TenantContext.setCurrentTenant(
                    savedOrg.getId().toString());
            // Seed default entities in a new transaction so the tenant context is freshly resolved
            organizationSeeder.seedNewOrganization(savedOrg.getId(), currentUser);
        } catch (Exception e) {
            // Rollback the organization creation manually since we aren't in a single transaction
            organizationRepository.delete(savedOrg);
            throw e;
        } finally {
            if (previousTenant != null) {
                com.billos.api.tenant.TenantContext.setCurrentTenant(previousTenant);
            } else {
                com.billos.api.tenant.TenantContext.clear();
            }
        }

        return savedOrg;
    }

    public Organization setupOrganization(@NonNull com.billos.api.dto.SetupOrganizationRequest request) {
        // Get current user
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser =
                userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        // Validate email suffix uniqueness
        String suffix = request.getEmailSuffix().toLowerCase().trim();
        if (organizationRepository.existsByEmailSuffix(suffix)) {
            throw new RuntimeException("Email suffix '" + suffix + "' is already taken. Please choose another.");
        }

        Organization org = new Organization();
        org.setName(request.getName());
        org.setLegalName(request.getLegalName());
        org.setGstin(request.getGstin());
        org.setAddressLine1(request.getAddressLine1());
        org.setAddressLine2(request.getAddressLine2());
        org.setCity(request.getCity());
        org.setState(request.getState());
        org.setPincode(request.getPincode());
        org.setEmail(request.getEmail());
        org.setPhone(request.getPhone());
        org.setSecondaryPhones(request.getSecondaryPhones());
        org.setWebsite(request.getWebsite());
        org.setLogoUrl(request.getLogoUrl());
        org.setIsPrimary(true);
        org.setEmailSuffix(suffix);
        org.setCreatedBy(currentUser.getId());
        org.setFinancialYearStart(
                java.time.LocalDate.of(java.time.LocalDate.now().getYear(), 4, 1));

        // Save and flush Organization immediately so it's visible to the seeder's new transaction
        Organization savedOrg = organizationRepository.saveAndFlush(org);

        String previousTenant = com.billos.api.tenant.TenantContext.getCurrentTenant();
        try {
            com.billos.api.tenant.TenantContext.setCurrentTenant(
                    savedOrg.getId().toString());
            // Seed all custom setup entities in a new transaction so the tenant context is freshly resolved
            organizationSeeder.seedSetupOrganization(savedOrg.getId(), currentUser, request);
        } catch (Exception e) {
            // Rollback the organization creation manually since we aren't in a single transaction
            organizationRepository.delete(savedOrg);
            throw e;
        } finally {
            if (previousTenant != null) {
                com.billos.api.tenant.TenantContext.setCurrentTenant(previousTenant);
            } else {
                com.billos.api.tenant.TenantContext.clear();
            }
        }

        return savedOrg;
    }

    public Organization createBranch(
            @NonNull UUID parentOrgId, @NonNull com.billos.api.dto.CreateBranchRequest request) {
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User currentUser =
                userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));

        Organization parentOrg = organizationRepository
                .findById(parentOrgId)
                .orElseThrow(() -> new RuntimeException("Primary parent organization not found"));

        // Validate user is authorized on parent organization
        java.util.Optional<UserOrgRole> parentRoleOpt =
                userOrgRoleRepository.findByUserIdAndOrganizationId(currentUser.getId(), parentOrgId);
        if (parentRoleOpt.isEmpty()
                || (!"OWNER".equalsIgnoreCase(parentRoleOpt.get().getRole())
                        && !"ADMIN".equalsIgnoreCase(parentRoleOpt.get().getRole()))) {
            throw new RuntimeException("Only an OWNER or ADMIN of the parent organization can create branches");
        }

        Organization branch = new Organization();
        branch.setName(request.getName());
        branch.setLegalName(request.getLegalName() != null ? request.getLegalName() : parentOrg.getLegalName());
        branch.setBranchCode(request.getBranchCode());
        branch.setGstin(request.getGstin());
        branch.setPhone(request.getPhone());
        branch.setSecondaryPhones(request.getSecondaryPhones());
        branch.setEmail(request.getEmail() != null ? request.getEmail() : parentOrg.getEmail());
        branch.setAddressLine1(request.getAddressLine1());
        branch.setAddressLine2(request.getAddressLine2());
        branch.setCity(request.getCity());
        branch.setState(request.getState());
        branch.setPincode(request.getPincode());
        branch.setCountry(request.getCountry() != null ? request.getCountry() : parentOrg.getCountry());
        branch.setWebsite(request.getWebsite() != null ? request.getWebsite() : parentOrg.getWebsite());
        branch.setLogoUrl(request.getLogoUrl() != null ? request.getLogoUrl() : parentOrg.getLogoUrl());
        branch.setFinancialYearStart(
                parentOrg.getFinancialYearStart() != null
                        ? parentOrg.getFinancialYearStart()
                        : java.time.LocalDate.of(java.time.LocalDate.now().getYear(), 4, 1));
        branch.setParentOrganizationId(parentOrg.getId());
        branch.setIsPrimary(false);
        branch.setCreatedBy(currentUser.getId());

        // Save branch organization
        Organization savedBranch = organizationRepository.saveAndFlush(branch);

        String previousTenant = com.billos.api.tenant.TenantContext.getCurrentTenant();
        try {
            com.billos.api.tenant.TenantContext.setCurrentTenant(
                    savedBranch.getId().toString());
            // Seed default branch setup: user as OWNER/ADMIN in branch, chart of accounts, default warehouse, and
            // settings
            organizationSeeder.seedNewOrganization(savedBranch.getId(), currentUser);
        } catch (Exception e) {
            organizationRepository.delete(savedBranch);
            throw e;
        } finally {
            if (previousTenant != null) {
                com.billos.api.tenant.TenantContext.setCurrentTenant(previousTenant);
            } else {
                com.billos.api.tenant.TenantContext.clear();
            }
        }

        return savedBranch;
    }

    @Transactional(readOnly = true)
    public List<Organization> getMyOrganizations() {
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<UserOrgRole> roles = userOrgRoleRepository.findByUserId(principal.getId());

        java.util.Map<UUID, Organization> orgMap = new java.util.LinkedHashMap<>();
        for (UserOrgRole role : roles) {
            organizationRepository.findById(role.getOrganizationId()).ifPresent(org -> {
                orgMap.put(org.getId(), org);
                // If this is a primary org or has branches, include its branches automatically
                List<Organization> branches = organizationRepository.findByParentOrganizationId(org.getId());
                for (Organization branch : branches) {
                    orgMap.put(branch.getId(), branch);
                }
            });
        }

        return new java.util.ArrayList<>(orgMap.values());
    }

    @Transactional(readOnly = true)
    public List<com.billos.api.dto.OrganizationTreeDto> getOrganizationTree() {
        List<Organization> myOrgs = getMyOrganizations();
        java.util.Map<UUID, com.billos.api.dto.OrganizationTreeDto> treeMap = new java.util.LinkedHashMap<>();

        // 1. Put all primary orgs first
        for (Organization org : myOrgs) {
            if (Boolean.TRUE.equals(org.getIsPrimary()) || org.getParentOrganizationId() == null) {
                treeMap.put(
                        org.getId(),
                        com.billos.api.dto.OrganizationTreeDto.builder()
                                .primaryOrganization(org)
                                .branches(new java.util.ArrayList<>())
                                .build());
            }
        }

        // 2. Attach branches
        for (Organization org : myOrgs) {
            if (org.getParentOrganizationId() != null) {
                com.billos.api.dto.OrganizationTreeDto parentTree = treeMap.get(org.getParentOrganizationId());
                if (parentTree != null) {
                    parentTree.getBranches().add(org);
                } else {
                    java.util.Optional<Organization> parentOpt =
                            organizationRepository.findById(org.getParentOrganizationId());
                    if (parentOpt.isPresent()) {
                        Organization parent = parentOpt.get();
                        com.billos.api.dto.OrganizationTreeDto newTree =
                                com.billos.api.dto.OrganizationTreeDto.builder()
                                        .primaryOrganization(parent)
                                        .branches(new java.util.ArrayList<>(List.of(org)))
                                        .build();
                        treeMap.put(parent.getId(), newTree);
                    } else {
                        treeMap.put(
                                org.getId(),
                                com.billos.api.dto.OrganizationTreeDto.builder()
                                        .primaryOrganization(org)
                                        .branches(new java.util.ArrayList<>())
                                        .build());
                    }
                }
            }
        }

        return new java.util.ArrayList<>(treeMap.values());
    }

    @Transactional(readOnly = true)
    public UUID resolvePrimaryOrgId(UUID currentOrgId) {
        if (currentOrgId == null) return null;
        return organizationRepository
                .findById(currentOrgId)
                .map(org -> org.getParentOrganizationId() != null ? org.getParentOrganizationId() : org.getId())
                .orElse(currentOrgId);
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
        if (updatedDetails.getLogoUrl() != null) org.setLogoUrl(updatedDetails.getLogoUrl());
        if (updatedDetails.getWebsite() != null) org.setWebsite(updatedDetails.getWebsite());
        if (updatedDetails.getBranchCode() != null) org.setBranchCode(updatedDetails.getBranchCode());
        if (updatedDetails.getIsPrimary() != null) org.setIsPrimary(updatedDetails.getIsPrimary());
        if (updatedDetails.getSecondaryPhones() != null) org.setSecondaryPhones(updatedDetails.getSecondaryPhones());

        if (updatedDetails.getEmailSuffix() != null
                && !updatedDetails.getEmailSuffix().isBlank()) {
            String newSuffix =
                    updatedDetails.getEmailSuffix().toLowerCase().trim().replaceAll("[^a-z0-9-]", "");
            if (!newSuffix.equals(org.getEmailSuffix())) {
                if (organizationRepository.existsByEmailSuffix(newSuffix)) {
                    throw new RuntimeException(
                            "Email suffix '" + newSuffix + "' is already taken. Please choose another.");
                }
                org.setEmailSuffix(newSuffix);
            }
        }

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
