package com.billos.api.service;

import com.billos.api.dto.BulkImportResultDto;
import com.billos.api.dto.ConsolidatedCustomerLedgerDto;
import com.billos.api.dto.ConsolidatedLedgerEntryDto;
import com.billos.api.dto.CustomerDto;
import com.billos.api.entity.Customer;
import com.billos.api.exception.ForbiddenException;
import com.billos.api.mapper.CustomerMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerMapper customerMapper;
    private final OrganizationService organizationService;
    private final SharedEntityResolver sharedEntityResolver;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            return java.util.Collections.emptyList();
        }
        UUID currentOrgId = UUID.fromString(currentTenant);
        UUID primaryOrgId = organizationService.resolvePrimaryOrgId(currentOrgId);

        List<Customer> customers = customerRepository.findAccessibleCustomers(currentOrgId, primaryOrgId);
        return customers.stream().map(customerMapper::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(UUID id) {
        Customer customer = sharedEntityResolver.accessibleCustomer(id);

        return customerMapper.toDto(customer);
    }

    @Transactional(readOnly = true)
    public ConsolidatedCustomerLedgerDto getConsolidatedLedger(UUID customerId) {
        Customer customer = sharedEntityResolver.accessibleCustomer(customerId);
        UUID primaryOrgId = organizationService.resolvePrimaryOrgId(sharedEntityResolver.currentOrgId());

        CustomerDto customerDto = customerMapper.toDto(customer);

        String sql =
                """
            SELECT si.id, si.invoice_date AS tx_date, 'INVOICE' AS tx_type, si.invoice_number AS doc_num,
                   si.organization_id, org.name AS branch_name, org.gstin AS branch_gstin, org.branch_code,
                   si.total_amount AS debit, 0.00 AS credit, si.notes
            FROM sales_invoices si
            JOIN organizations org ON si.organization_id = org.id
            WHERE si.customer_id = ?
              AND (org.id = ? OR org.parent_organization_id = ?)
              AND si.deleted_at IS NULL
            UNION ALL
            SELECT p.id, p.payment_date AS tx_date, 'PAYMENT' AS tx_type, p.payment_number AS doc_num,
                   p.organization_id, org.name AS branch_name, org.gstin AS branch_gstin, org.branch_code,
                   0.00 AS debit, pa.allocated_amount AS credit, p.notes
            FROM payment_allocations pa
            JOIN payments p ON pa.payment_id = p.id
            JOIN sales_invoices si ON pa.sales_invoice_id = si.id
            JOIN organizations org ON p.organization_id = org.id
            WHERE si.customer_id = ?
              AND (org.id = ? OR org.parent_organization_id = ?)
              AND p.deleted_at IS NULL
            ORDER BY tx_date ASC
            """;

        List<ConsolidatedLedgerEntryDto> entries = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> ConsolidatedLedgerEntryDto.builder()
                        .id((UUID) rs.getObject("id"))
                        .transactionDate(rs.getDate("tx_date").toLocalDate())
                        .transactionType(rs.getString("tx_type"))
                        .documentNumber(rs.getString("doc_num"))
                        .organizationId((UUID) rs.getObject("organization_id"))
                        .branchName(rs.getString("branch_name"))
                        .branchGstin(rs.getString("branch_gstin"))
                        .branchCode(rs.getString("branch_code"))
                        .debit(rs.getBigDecimal("debit"))
                        .credit(rs.getBigDecimal("credit"))
                        .notes(rs.getString("notes"))
                        .build(),
                customerId,
                primaryOrgId,
                primaryOrgId,
                customerId,
                primaryOrgId,
                primaryOrgId);

        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal runningBalance = BigDecimal.ZERO;

        for (ConsolidatedLedgerEntryDto entry : entries) {
            BigDecimal debit = entry.getDebit() != null ? entry.getDebit() : BigDecimal.ZERO;
            BigDecimal credit = entry.getCredit() != null ? entry.getCredit() : BigDecimal.ZERO;
            totalInvoiced = totalInvoiced.add(debit);
            totalPaid = totalPaid.add(credit);
            runningBalance = runningBalance.add(debit).subtract(credit);
            entry.setRunningBalance(runningBalance);
        }

        return ConsolidatedCustomerLedgerDto.builder()
                .customer(customerDto)
                .totalInvoiced(totalInvoiced)
                .totalPaid(totalPaid)
                .netOutstandingBalance(runningBalance)
                .entries(entries)
                .build();
    }

    @Transactional
    public CustomerDto createCustomer(CustomerDto customerDto) {
        Customer customer = customerMapper.toEntity(customerDto);
        UUID currentOrgId = UUID.fromString(TenantContext.getCurrentTenant());
        customer.setOrganizationId(currentOrgId);
        customer.setOriginatingOrgId(currentOrgId);
        if (customerDto.getIsShared() != null) {
            customer.setIsShared(customerDto.getIsShared());
        } else {
            customer.setIsShared(true);
        }
        if (customer.getOutstandingBalance() == null) {
            customer.setOutstandingBalance(java.math.BigDecimal.ZERO);
        }
        if (customer.getBillingCountry() == null
                || customer.getBillingCountry().trim().isEmpty()) {
            customer.setBillingCountry("India");
        }
        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toDto(savedCustomer);
    }

    @Transactional
    public BulkImportResultDto bulkCreateCustomers(List<CustomerDto> dtos) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = UUID.fromString(currentTenant);

        BulkImportResultDto result = new BulkImportResultDto();
        result.setTotalCount(dtos.size());

        List<Customer> customersToSave = new java.util.ArrayList<>();
        java.util.Set<String> seenPhones = new java.util.HashSet<>();

        for (int i = 0; i < dtos.size(); i++) {
            CustomerDto dto = dtos.get(i);
            int rowNum = i + 1;

            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                result.getErrors()
                        .add(new BulkImportResultDto.BulkImportErrorDto(
                                rowNum,
                                dto.getPhone() != null ? dto.getPhone() : "Row " + rowNum,
                                "Customer name is required"));
                result.setSkippedCount(result.getSkippedCount() + 1);
                continue;
            }

            String phone = dto.getPhone() != null ? dto.getPhone().trim() : "";
            if (!phone.isEmpty()) {
                if (seenPhones.contains(phone)
                        || customerRepository.existsByOrganizationIdAndPhone(currentOrgId, phone)) {
                    result.getErrors()
                            .add(new BulkImportResultDto.BulkImportErrorDto(
                                    rowNum,
                                    phone,
                                    "Customer with phone '" + phone + "' already exists or is duplicated in file"));
                    result.setSkippedCount(result.getSkippedCount() + 1);
                    continue;
                }
                seenPhones.add(phone);
            }

            Customer customer = customerMapper.toEntity(dto);
            customer.setOrganizationId(currentOrgId);
            customer.setOriginatingOrgId(currentOrgId);
            customer.setIsShared(dto.getIsShared() != null ? dto.getIsShared() : true);
            if (customer.getOutstandingBalance() == null) {
                customer.setOutstandingBalance(java.math.BigDecimal.ZERO);
            }
            if (customer.getBillingCountry() == null
                    || customer.getBillingCountry().trim().isEmpty()) {
                customer.setBillingCountry("India");
            }

            customersToSave.add(customer);
        }

        if (!customersToSave.isEmpty()) {
            customerRepository.saveAll(customersToSave);
            result.setInsertedCount(customersToSave.size());
        }

        return result;
    }

    @Transactional
    public CustomerDto updateCustomer(UUID id, CustomerDto customerDto) {
        Customer existingCustomer = ownedCustomer(id, "modify");

        customerMapper.updateEntityFromDto(customerDto, existingCustomer);
        Customer updatedCustomer = customerRepository.save(existingCustomer);
        return customerMapper.toDto(updatedCustomer);
    }

    @Transactional
    public void deleteCustomer(UUID id) {
        Customer customer = ownedCustomer(id, "delete");
        customerRepository.delete(customer);
    }

    private Customer ownedCustomer(UUID id, String action) {
        Customer customer = sharedEntityResolver.accessibleCustomer(id);
        if (!sharedEntityResolver.isOwnedByCurrentOrg(customer.getOrganizationId())) {
            throw new ForbiddenException("Branch cannot " + action + " customers owned by the Primary Organization.");
        }
        return customer;
    }
}
