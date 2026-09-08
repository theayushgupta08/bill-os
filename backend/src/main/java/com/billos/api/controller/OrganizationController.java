package com.billos.api.controller;

import com.billos.api.dto.OrganizationSettingsDto;
import com.billos.api.entity.Organization;
import com.billos.api.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
@SuppressWarnings("null")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<Organization> createOrganization(@Valid @RequestBody Organization organization) {
        Organization createdOrg = organizationService.createOrganization(organization);
        return ResponseEntity.ok(createdOrg);
    }

    @PostMapping("/setup")
    public ResponseEntity<Organization> setupOrganization(
            @Valid @RequestBody com.billos.api.dto.SetupOrganizationRequest request) {
        Organization createdOrg = organizationService.setupOrganization(request);
        return ResponseEntity.ok(createdOrg);
    }

    @GetMapping
    public ResponseEntity<List<Organization>> getMyOrganizations() {
        List<Organization> organizations = organizationService.getMyOrganizations();
        return ResponseEntity.ok(organizations);
    }

    @GetMapping("/tree")
    public ResponseEntity<List<com.billos.api.dto.OrganizationTreeDto>> getOrganizationTree() {
        List<com.billos.api.dto.OrganizationTreeDto> tree = organizationService.getOrganizationTree();
        return ResponseEntity.ok(tree);
    }

    @PostMapping("/{parentOrgId}/branches")
    public ResponseEntity<Organization> createBranch(
            @PathVariable java.util.UUID parentOrgId,
            @Valid @RequestBody com.billos.api.dto.CreateBranchRequest request) {
        Organization branch = organizationService.createBranch(parentOrgId, request);
        return ResponseEntity.ok(branch);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(@PathVariable java.util.UUID id) {
        // Technically we should check if user belongs to this org,
        // but TenantFilter/TenantSecurity handles access at broader levels,
        // and getMyOrganizations gets all. For now we will just use getMyOrganizations and filter.
        return organizationService.getMyOrganizations().stream()
                .filter(org -> org.getId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(
            @PathVariable java.util.UUID id, @Valid @RequestBody Organization organization) {
        // Assume security handles authorization (e.g. only OWNER/ADMIN can update)
        Organization updatedOrg = organizationService.updateOrganization(id, organization);
        return ResponseEntity.ok(updatedOrg);
    }

    @GetMapping("/{id}/settings")
    public ResponseEntity<OrganizationSettingsDto> getOrganizationSettings(@PathVariable java.util.UUID id) {
        OrganizationSettingsDto settings = organizationService.getOrganizationSettings(id);
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/{id}/settings")
    public ResponseEntity<OrganizationSettingsDto> updateOrganizationSettings(
            @PathVariable java.util.UUID id, @RequestBody OrganizationSettingsDto dto) {
        OrganizationSettingsDto updatedSettings = organizationService.updateOrganizationSettings(id, dto);
        return ResponseEntity.ok(updatedSettings);
    }
}
