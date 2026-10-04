package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.billos.api.dto.ConsolidatedCustomerLedgerDto;
import com.billos.api.dto.ConsolidatedLedgerEntryDto;
import com.billos.api.dto.CustomerDto;
import com.billos.api.entity.Customer;
import com.billos.api.mapper.CustomerMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerMapper customerMapper;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @Mock
    private CustomerBalanceService customerBalanceService;

    @InjectMocks
    private CustomerService customerService;

    private final String tenantId = "550e8400-e29b-41d4-a716-446655440000";

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("createCustomer - should set organizationId from TenantContext")
    void createCustomer_shouldSetOrganizationId() {
        // Arrange
        CustomerDto inputDto = new CustomerDto();
        inputDto.setName("Test Customer");

        Customer entity = new Customer();
        entity.setName("Test Customer");

        Customer savedEntity = new Customer();
        savedEntity.setId(UUID.randomUUID());
        savedEntity.setName("Test Customer");
        savedEntity.setOrganizationId(UUID.fromString(tenantId));

        CustomerDto outputDto = new CustomerDto();
        outputDto.setId(savedEntity.getId());
        outputDto.setName("Test Customer");

        when(customerMapper.toEntity(inputDto)).thenReturn(entity);
        when(customerRepository.save(entity)).thenReturn(savedEntity);
        when(customerMapper.toDto(savedEntity)).thenReturn(outputDto);

        // Act
        CustomerDto result = customerService.createCustomer(inputDto);

        // Assert
        assertThat(result.getId()).isEqualTo(outputDto.getId());
        assertThat(entity.getOrganizationId()).isEqualTo(UUID.fromString(tenantId)); // Verify tenant ID was set
        verify(customerRepository).save(entity);
    }

    @Test
    @DisplayName("getCustomerById - should return customer if found")
    void getCustomerById_shouldReturnCustomer() {
        // Arrange
        UUID customerId = UUID.randomUUID();
        Customer customer = new Customer();
        customer.setId(customerId);

        CustomerDto dto = new CustomerDto();
        dto.setId(customerId);

        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(customerMapper.toDto(customer)).thenReturn(dto);
        when(customerBalanceService.forCurrentOrg()).thenReturn(c -> new BigDecimal("42.00"));

        // Act
        CustomerDto result = customerService.getCustomerById(customerId);

        // Assert
        assertThat(result.getId()).isEqualTo(customerId);
        // The balance shown is what the customer owes this organization, not the shared column
        assertThat(result.getOutstandingBalance()).isEqualByComparingTo("42.00");
    }

    @Test
    @DisplayName("getConsolidatedLedger - a branch sees only its own documents, not its parent's or siblings'")
    void getConsolidatedLedger_shouldScopeBranchToItself() {
        UUID customerId = UUID.randomUUID();
        UUID branchId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        stubLedger(customerId, branchId, parentId);

        customerService.getConsolidatedLedger(customerId);

        assertThat(ledgerQueryParameters())
                .containsExactly(customerId, branchId, false, branchId, customerId, branchId, false, branchId);
    }

    @Test
    @DisplayName("getConsolidatedLedger - the parent organization sees the whole family")
    void getConsolidatedLedger_shouldGiveParentTheFamily() {
        UUID customerId = UUID.randomUUID();
        UUID parentId = UUID.randomUUID();
        stubLedger(customerId, parentId, parentId);

        customerService.getConsolidatedLedger(customerId);

        assertThat(ledgerQueryParameters())
                .containsExactly(customerId, parentId, true, parentId, customerId, parentId, true, parentId);
    }

    @Test
    @DisplayName("getConsolidatedLedger - only issued invoices are debits; drafts and voids owe nothing")
    void getConsolidatedLedger_shouldLeaveOutDraftAndVoidInvoices() {
        UUID customerId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        stubLedger(customerId, orgId, orgId);

        customerService.getConsolidatedLedger(customerId);

        String sql = (String)
                mockingDetails(jdbcTemplate).getInvocations().iterator().next().getArguments()[0];
        assertThat(sql).contains("si.status IN ('ISSUED', 'PARTIAL', 'PAID')");
        // Same-day invoice before its payment, so the running balance never dips below zero mid-day
        assertThat(sql).contains("ORDER BY tx_date ASC, tx_type ASC");
    }

    @Test
    @DisplayName("getConsolidatedLedger - totals and running balance follow the entries")
    void getConsolidatedLedger_shouldRunTheBalance() {
        UUID customerId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        stubLedger(customerId, orgId, orgId);
        when(jdbcTemplate.query(
                        anyString(),
                        org.mockito.ArgumentMatchers
                                .<org.springframework.jdbc.core.RowMapper<ConsolidatedLedgerEntryDto>>any(),
                        any(Object[].class)))
                .thenReturn(List.of(entry("1180.00", "0.00"), entry("0.00", "500.00"), entry("590.00", "0.00")));

        ConsolidatedCustomerLedgerDto ledger = customerService.getConsolidatedLedger(customerId);

        assertThat(ledger.getTotalInvoiced()).isEqualByComparingTo("1770.00");
        assertThat(ledger.getTotalPaid()).isEqualByComparingTo("500.00");
        assertThat(ledger.getNetOutstandingBalance()).isEqualByComparingTo("1270.00");
        assertThat(ledger.getEntries())
                .extracting(ConsolidatedLedgerEntryDto::getRunningBalance)
                .usingElementComparator(BigDecimal::compareTo)
                .containsExactly(new BigDecimal("1180.00"), new BigDecimal("680.00"), new BigDecimal("1270.00"));
    }

    private static ConsolidatedLedgerEntryDto entry(String debit, String credit) {
        return ConsolidatedLedgerEntryDto.builder()
                .debit(new BigDecimal(debit))
                .credit(new BigDecimal(credit))
                .build();
    }

    private void stubLedger(UUID customerId, UUID currentOrg, UUID primaryOrg) {
        Customer customer = new Customer();
        customer.setId(customerId);
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.currentOrgId()).thenReturn(currentOrg);
        when(organizationService.resolvePrimaryOrgId(currentOrg)).thenReturn(primaryOrg);
        when(customerMapper.toDto(customer)).thenReturn(new CustomerDto());
        when(customerBalanceService.forCurrentOrg()).thenReturn(c -> BigDecimal.ZERO);
    }

    /** The bind parameters of the single ledger query (after the SQL and the row mapper). */
    private Object[] ledgerQueryParameters() {
        Object[] args =
                mockingDetails(jdbcTemplate).getInvocations().iterator().next().getArguments();
        return Arrays.copyOfRange(args, 2, args.length);
    }

    @Test
    @DisplayName("getCustomerById - should throw if not found")
    void getCustomerById_shouldThrowIfNotFound() {
        // Arrange
        UUID customerId = UUID.randomUUID();
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenThrow(new RuntimeException("Customer not found"));

        // Act & Assert
        assertThatThrownBy(() -> customerService.getCustomerById(customerId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Customer not found");
    }

    @Test
    @DisplayName("deleteCustomer - should refuse to delete a parent org's shared customer")
    void deleteCustomer_shouldRefuse_whenCustomerOwnedByParentOrg() {
        UUID customerId = UUID.randomUUID();
        UUID parentOrgId = UUID.randomUUID();
        Customer customer = new Customer();
        customer.setId(customerId);
        customer.setOrganizationId(parentOrgId);
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.isOwnedByCurrentOrg(parentOrgId)).thenReturn(false);

        assertThatThrownBy(() -> customerService.deleteCustomer(customerId))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Branch cannot delete");
        verify(customerRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteCustomer - should delete a customer owned by the current org")
    void deleteCustomer_shouldDelete_whenOwnedByCurrentOrg() {
        UUID customerId = UUID.randomUUID();
        UUID orgId = UUID.fromString(tenantId);
        Customer customer = new Customer();
        customer.setOrganizationId(orgId);
        when(sharedEntityResolver.accessibleCustomer(customerId)).thenReturn(customer);
        when(sharedEntityResolver.isOwnedByCurrentOrg(orgId)).thenReturn(true);

        customerService.deleteCustomer(customerId);

        verify(customerRepository).delete(customer);
    }
}
