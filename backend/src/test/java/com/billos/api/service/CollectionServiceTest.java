package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.billos.api.dto.CollectionExpenseDto;
import com.billos.api.dto.CollectionPaymentDto;
import com.billos.api.dto.SettlementDepositDto;
import com.billos.api.dto.UserDashboardDto;
import com.billos.api.entity.CollectionLedger;
import com.billos.api.entity.CollectionPayment;
import com.billos.api.entity.User;
import com.billos.api.exception.BadRequestException;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CollectionServiceTest {

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserOrgRoleRepository userOrgRoleRepository;

    @Mock
    private CollectionQrCodeRepository qrCodeRepository;

    @Mock
    private CollectionPaymentRepository paymentRepository;

    @Mock
    private CollectionExpenseRepository expenseRepository;

    @Mock
    private SettlementDepositRepository depositRepository;

    @Mock
    private CollectionLedgerRepository ledgerRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private SharedEntityResolver sharedEntityResolver;

    @Mock
    private OrganizationClock organizationClock;

    @InjectMocks
    private CollectionService collectionService;

    private final UUID orgId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(orgId.toString());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void recordExpense_rejectsNegativeAmount() {
        // Regression: an approved -500 expense added 500 to the employee's cash in hand
        CollectionExpenseDto dto = new CollectionExpenseDto();
        dto.setAmount(new BigDecimal("-500"));

        assertThatThrownBy(() -> collectionService.recordExpense(dto))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Expense amount must be greater than zero");
        verifyNoInteractions(expenseRepository, ledgerRepository);
    }

    @Test
    void recordDeposit_rejectsZeroAmount() {
        SettlementDepositDto dto = new SettlementDepositDto();
        dto.setAmount(BigDecimal.ZERO);

        assertThatThrownBy(() -> collectionService.recordDeposit(dto))
                .hasMessage("Deposit amount must be greater than zero");
        verifyNoInteractions(depositRepository);
    }

    @Test
    void recordPayment_rejectsNegativeAmount() {
        CollectionPaymentDto dto = new CollectionPaymentDto();
        dto.setAmount(new BigDecimal("-1"));

        assertThatThrownBy(() -> collectionService.recordPayment(dto))
                .hasMessage("Collected amount must be greater than zero");
        verifyNoInteractions(paymentRepository);
    }

    @Test
    void userDashboard_countsTodaysCollections_onTheOrganizationsCalendar() {
        // Verified at 01:00 IST today — still yesterday in UTC, which the server's clock used to go by
        UUID userId = UUID.randomUUID();
        User owner = new User();
        owner.setId(userId);
        CollectionPayment earlyToday = verifiedPayment(owner, "500.00", LocalDate.now(INDIA), LocalTime.of(1, 0));
        CollectionPayment yesterday =
                verifiedPayment(owner, "200.00", LocalDate.now(INDIA).minusDays(1), LocalTime.of(23, 0));
        CollectionLedger ledger = new CollectionLedger();
        ledger.setOrganizationId(orgId);
        ledger.setAmount(new BigDecimal("700.00"));
        when(organizationClock.zoneOf(orgId)).thenReturn(INDIA);
        when(ledgerRepository.findByUserId(userId)).thenReturn(List.of(ledger));
        when(paymentRepository.findAll()).thenReturn(List.of(earlyToday, yesterday));
        when(expenseRepository.findAll()).thenReturn(List.of());
        when(depositRepository.findAll()).thenReturn(List.of());

        UserDashboardDto dashboard = collectionService.getUserDashboard(userId);

        assertThat(dashboard.getTodayCollections()).isEqualByComparingTo("500.00");
        assertThat(dashboard.getCurrentCollectionBalance()).isEqualByComparingTo("700.00");
    }

    private CollectionPayment verifiedPayment(User owner, String amount, LocalDate day, LocalTime time) {
        CollectionPayment p = new CollectionPayment();
        p.setOrganizationId(orgId);
        p.setQrOwner(owner);
        p.setStatus("VERIFIED");
        p.setAmount(new BigDecimal(amount));
        // Stored timestamps come back from the database in UTC
        p.setVerifiedAt(day.atTime(time).atZone(INDIA).toOffsetDateTime().withOffsetSameInstant(ZoneOffset.UTC));
        return p;
    }
}
