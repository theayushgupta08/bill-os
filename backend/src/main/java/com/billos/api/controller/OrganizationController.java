package com.billos.api.controller;

import com.billos.api.entity.Organization;
import com.billos.api.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<Organization> createOrganization(@RequestBody Organization organization) {
        Organization createdOrg = organizationService.createOrganization(organization);
        return ResponseEntity.ok(createdOrg);
    }

    @GetMapping
    public ResponseEntity<List<Organization>> getMyOrganizations() {
        List<Organization> organizations = organizationService.getMyOrganizations();
        return ResponseEntity.ok(organizations);
    }
}
