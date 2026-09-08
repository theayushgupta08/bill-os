package com.billos.api.service;

import com.billos.api.dto.SetupOrganizationRequest;
import com.billos.api.dto.TaxSlabDto;
import com.billos.api.dto.WarehouseSetupDto;
import com.billos.api.entity.OrganizationSettings;
import com.billos.api.entity.TaxRate;
import com.billos.api.entity.User;
import com.billos.api.entity.UserOrgRole;
import com.billos.api.entity.Warehouse;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.repository.TaxRateRepository;
import com.billos.api.repository.UserOrgRoleRepository;
import com.billos.api.repository.WarehouseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
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
    private final WarehouseRepository warehouseRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;
    private final TaxRateRepository taxRateRepository;
    private final ObjectMapper objectMapper;

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void seedSetupOrganization(UUID orgId, User currentUser, SetupOrganizationRequest request) {
        // 1. Assign OWNER role
        UserOrgRole userOrgRole = new UserOrgRole();
        userOrgRole.setUser(currentUser);
        userOrgRole.setOrganizationId(orgId);
        userOrgRole.setRole("OWNER");
        userOrgRoleRepository.save(userOrgRole);

        // 2. Chart of Accounts
        accountService.seedDefaultAccounts(orgId);

        // 3. Seed Warehouses
        if (request.getWarehouses() != null && !request.getWarehouses().isEmpty()) {
            int fallbackIndex = 1;
            for (WarehouseSetupDto whDto : request.getWarehouses()) {
                Warehouse wh = new Warehouse();
                wh.setOrganizationId(orgId);

                String name =
                        (whDto.getName() != null && !whDto.getName().trim().isEmpty())
                                ? whDto.getName().trim()
                                : "Warehouse " + fallbackIndex;

                wh.setName(name);

                String code =
                        (whDto.getCode() != null && !whDto.getCode().trim().isEmpty())
                                ? whDto.getCode().trim().toUpperCase()
                                : (whDto.isPrimary() ? "MAIN" : "WH-" + fallbackIndex);

                wh.setCode(code);
                wh.setAddressLine1(
                        whDto.getAddressLine1() != null ? whDto.getAddressLine1() : request.getAddressLine1());
                wh.setAddressLine2(
                        whDto.getAddressLine2() != null ? whDto.getAddressLine2() : request.getAddressLine2());
                wh.setCity(whDto.getCity() != null ? whDto.getCity() : request.getCity());
                wh.setState(whDto.getState() != null ? whDto.getState() : request.getState());
                wh.setPincode(whDto.getPincode() != null ? whDto.getPincode() : request.getPincode());
                wh.setActive(true);
                warehouseRepository.save(wh);

                fallbackIndex++;
            }
        } else {
            // Default primary warehouse
            Warehouse defaultWarehouse = new Warehouse();
            defaultWarehouse.setOrganizationId(orgId);
            defaultWarehouse.setName("Primary Warehouse");
            defaultWarehouse.setCode("MAIN");
            defaultWarehouse.setAddressLine1(request.getAddressLine1());
            defaultWarehouse.setAddressLine2(request.getAddressLine2());
            defaultWarehouse.setCity(request.getCity());
            defaultWarehouse.setState(request.getState());
            defaultWarehouse.setPincode(request.getPincode());
            defaultWarehouse.setActive(true);
            warehouseRepository.save(defaultWarehouse);
        }

        // 4. Seed Organization Settings
        OrganizationSettings settings = new OrganizationSettings();
        settings.setOrganizationId(orgId);
        settings.setDateFormat(request.getDateFormat() != null ? request.getDateFormat() : "DD/MM/YYYY");
        settings.setInvoicePrefix(request.getInvoicePrefix() != null ? request.getInvoicePrefix() : "INV-");
        settings.setTimezone(request.getTimezone() != null ? request.getTimezone() : "Asia/Kolkata");
        settings.setLanguage(request.getLanguage() != null ? request.getLanguage() : "en");

        // Serialize bullet invoice terms
        if (request.getInvoiceTerms() != null && !request.getInvoiceTerms().isEmpty()) {
            try {
                settings.setInvoiceTerms(objectMapper.writeValueAsString(request.getInvoiceTerms()));
            } catch (Exception e) {
                settings.setInvoiceTerms(String.join("\n", request.getInvoiceTerms()));
            }
        }

        // Serialize structured bank details
        if (request.getBankDetails() != null) {
            try {
                settings.setBankDetails(objectMapper.writeValueAsString(request.getBankDetails()));
            } catch (Exception ignored) {
            }
        }

        organizationSettingsRepository.save(settings);

        // 5. Seed Tax Slabs
        if (request.getTaxSlabs() != null && !request.getTaxSlabs().isEmpty()) {
            for (TaxSlabDto slab : request.getTaxSlabs()) {
                TaxRate tr = new TaxRate();
                tr.setOrganizationId(orgId);
                tr.setName(slab.getName() != null ? slab.getName() : "GST " + slab.getRate() + "%");
                tr.setRate(slab.getRate() != null ? slab.getRate() : BigDecimal.ZERO);
                tr.setCgstRate(slab.getCgstRate() != null ? slab.getCgstRate() : BigDecimal.ZERO);
                tr.setSgstRate(slab.getSgstRate() != null ? slab.getSgstRate() : BigDecimal.ZERO);
                tr.setIgstRate(slab.getIgstRate() != null ? slab.getIgstRate() : BigDecimal.ZERO);
                tr.setActive(true);
                taxRateRepository.save(tr);
            }
        } else {
            // Default 18% slab (9% CGST + 9% SGST)
            TaxRate defaultSlab = new TaxRate();
            defaultSlab.setOrganizationId(orgId);
            defaultSlab.setName("GST 18% (9% CGST + 9% SGST)");
            defaultSlab.setRate(new BigDecimal("18.00"));
            defaultSlab.setCgstRate(new BigDecimal("9.00"));
            defaultSlab.setSgstRate(new BigDecimal("9.00"));
            defaultSlab.setIgstRate(BigDecimal.ZERO);
            defaultSlab.setActive(true);
            taxRateRepository.save(defaultSlab);
        }
    }
}
