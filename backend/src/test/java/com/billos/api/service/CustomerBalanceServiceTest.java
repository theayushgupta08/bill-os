package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.billos.api.entity.Customer;
import com.billos.api.repository.SalesInvoiceRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerBalanceServiceTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @InjectMocks
    private CustomerBalanceService customerBalanceService;

    private final UUID currentOrg = UUID.randomUUID();
    private final UUID parentOrg = UUID.randomUUID();

    @Test
    void ownedCustomer_shouldUseItsOwnLedger_withoutQueryingInvoices() {
        Customer owned = customer(currentOrg, "300.00");
        when(sharedEntityResolver.isOwnedByCurrentOrg(currentOrg)).thenReturn(true);

        assertThat(customerBalanceService.forCurrentOrg().apply(owned)).isEqualByComparingTo("300.00");
        verifyNoInteractions(salesInvoiceRepository);
    }

    @Test
    void sharedCustomer_shouldShowOnlyWhatThisOrgIsOwed() {
        // The parent's column holds 9,999 — none of it is this branch's business
        Customer shared = customer(parentOrg, "9999.00");
        Customer untouched = customer(parentOrg, "500.00");
        when(sharedEntityResolver.isOwnedByCurrentOrg(parentOrg)).thenReturn(false);
        when(salesInvoiceRepository.sumDueByCustomer(any()))
                .thenReturn(List.<Object[]>of(new Object[] {shared.getId(), new BigDecimal("1250.00")}));

        Function<Customer, BigDecimal> balance = customerBalanceService.forCurrentOrg();

        assertThat(balance.apply(shared)).isEqualByComparingTo("1250.00");
        assertThat(balance.apply(untouched)).isEqualByComparingTo("0");
        verify(salesInvoiceRepository, times(1)).sumDueByCustomer(any()); // queried once, then reused
    }

    private Customer customer(UUID org, String balance) {
        Customer customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setOrganizationId(org);
        customer.setOutstandingBalance(new BigDecimal(balance));
        return customer;
    }
}
