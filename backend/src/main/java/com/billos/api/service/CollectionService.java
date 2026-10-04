package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ForbiddenException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.repository.*;
import com.billos.api.security.UserPrincipal;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final CollectionQrCodeRepository qrCodeRepository;
    private final CollectionPaymentRepository paymentRepository;
    private final CollectionExpenseRepository expenseRepository;
    private final SettlementDepositRepository depositRepository;
    private final CollectionLedgerRepository ledgerRepository;
    private final NotificationService notificationService;
    private final OrganizationService organizationService;
    private final SharedEntityResolver sharedEntityResolver;
    private final OrganizationClock organizationClock;

    // --- QR Code Management ---

    @Transactional(readOnly = true)
    public List<CollectionQrCodeDto> getQrCodes() {
        String currentTenant = TenantContext.getCurrentTenant();
        if (currentTenant == null) {
            return java.util.Collections.emptyList();
        }
        UUID currentOrgId = UUID.fromString(currentTenant);
        UUID primaryOrgId = organizationService.resolvePrimaryOrgId(currentOrgId);

        return qrCodeRepository.findAccessibleQrCodes(currentOrgId, primaryOrgId).stream()
                .map(this::toQrDto)
                .collect(Collectors.toList());
    }

    @Transactional
    @Audited(entity = "Collection", action = "CREATE_QR")
    public CollectionQrCodeDto createQrCode(CollectionQrCodeDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        UUID targetUserId = dto.getUserId();
        if (targetUserId == null) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                    targetUserId = principal.getId();
                }
            } catch (Exception ignored) {
            }
        }

        if (targetUserId == null) {
            throw new BadRequestException("User assignment is required. Each QR code must belong to a user.");
        }

        UUID finalTargetUserId = targetUserId;
        User user = userRepository
                .findById(finalTargetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Selected user not found"));

        userOrgRoleRepository
                .findByUserIdAndOrganizationId(user.getId(), orgId)
                .filter(UserOrgRole::isActiveMembership)
                .orElseThrow(() -> new BadRequestException("Selected user does not belong to this organization"));

        CollectionQrCode qr = new CollectionQrCode();
        qr.setOrganizationId(orgId);
        qr.setUser(user);
        qr.setNickname(dto.getNickname() != null ? dto.getNickname() : "Default QR");
        qr.setQrImageUrl(dto.getQrImageUrl());
        qr.setIsActive(true);

        return toQrDto(qrCodeRepository.save(qr));
    }

    @Transactional
    @Audited(entity = "Collection", action = "UPDATE_QR")
    public CollectionQrCodeDto updateQrCode(UUID id, CollectionQrCodeDto dto) {
        CollectionQrCode qr = sharedEntityResolver.accessibleQrCode(id);
        if (!sharedEntityResolver.isOwnedByCurrentOrg(qr.getOrganizationId())) {
            throw new ForbiddenException("Branch cannot modify QR codes owned by the Primary Organization.");
        }

        if (dto.getNickname() != null) {
            qr.setNickname(dto.getNickname());
        }
        if (dto.getIsActive() != null) {
            qr.setIsActive(dto.getIsActive());
        }
        if (dto.getQrImageUrl() != null) {
            qr.setQrImageUrl(dto.getQrImageUrl());
        }
        if (dto.getUserId() != null) {
            UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
            User user = userRepository
                    .findById(dto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Selected user not found"));
            userOrgRoleRepository
                    .findByUserIdAndOrganizationId(user.getId(), orgId)
                    .filter(UserOrgRole::isActiveMembership)
                    .orElseThrow(() -> new BadRequestException("Selected user does not belong to this organization"));
            qr.setUser(user);
        }

        return toQrDto(qrCodeRepository.save(qr));
    }

    // --- Record Collection Payment ---

    @Transactional(readOnly = true)
    public List<CollectionPaymentDto> getPayments() {
        return paymentRepository.findAll().stream().map(this::toPaymentDto).collect(Collectors.toList());
    }

    @Transactional
    @Audited(entity = "Collection", action = "RECORD_PAYMENT")
    public CollectionPaymentDto recordPayment(CollectionPaymentDto dto) {
        UUID currentOrgId = UUID.fromString(TenantContext.getCurrentTenant());
        UUID primaryOrgId = organizationService.resolvePrimaryOrgId(currentOrgId);
        BigDecimal amount = TaxMath.positiveAmount(dto.getAmount(), "Collected amount");

        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User recorder = userRepository.findById(principal.getId()).orElseThrow();

        CollectionQrCode qr = qrCodeRepository
                .findAccessibleById(dto.getQrCodeId(), currentOrgId, primaryOrgId)
                .orElseThrow(() -> new ResourceNotFoundException("QR Code not found"));

        Customer customer = null;
        if (dto.getCustomerId() != null) {
            customer = sharedEntityResolver.accessibleCustomer(dto.getCustomerId());
        }

        CollectionPayment payment = new CollectionPayment();
        // QR Code Collection Routing: Route into the Primary Organization's books (where QR is registered)
        payment.setOrganizationId(qr.getOrganizationId());
        // Tag the collecting branch where transaction occurred
        payment.setCollectingOrganizationId(currentOrgId);
        payment.setCustomer(customer);
        payment.setQrCode(qr);
        payment.setRecordedBy(recorder);
        payment.setQrOwner(qr.getUser());
        payment.setAmount(amount);
        payment.setPlace(dto.getPlace());
        payment.setRecordedAt(OffsetDateTime.now());
        payment.setUtrNumber(dto.getUtrNumber());
        payment.setReferenceNumber(dto.getReferenceNumber());
        payment.setScreenshotUrl(dto.getScreenshotUrl());
        payment.setStatus("PENDING_VERIFICATION");

        CollectionPayment saved = paymentRepository.save(payment);

        // Notify QR Owner
        notificationService.sendNotification(
                qr.getUser().getId(),
                "INFO",
                "New Collection Payment Recorded",
                "A payment of ₹" + amount + " has been recorded using your QR (" + qr.getNickname()
                        + "). Please verify.",
                "COLLECTION",
                saved.getId());

        return toPaymentDto(saved);
    }

    @Transactional
    @Audited(entity = "Collection", action = "VERIFY_PAYMENT")
    public void verifyPayment(UUID id, boolean verify, String remarks) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User verifier = userRepository.findById(principal.getId()).orElseThrow();

        CollectionPayment payment = paymentRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found"));

        if (!"PENDING_VERIFICATION".equals(payment.getStatus())) {
            throw new ConflictException("Payment is already verified or rejected");
        }

        // Only QR owner or Owner/Admin can verify
        String verifierRole = getMemberRole(verifier.getId(), orgId);
        boolean isOwner = verifier.getId().equals(payment.getQrOwner().getId());
        boolean hasAccess = isOwner || "OWNER".equals(verifierRole) || "ADMIN".equals(verifierRole);

        if (!hasAccess) {
            throw new ForbiddenException("You do not have permission to verify this payment");
        }

        payment.setVerifiedBy(verifier);
        payment.setVerifiedAt(OffsetDateTime.now());
        payment.setRemarks(remarks);

        if (verify) {
            payment.setStatus("VERIFIED");
            paymentRepository.save(payment);

            // Create ledger entry (+ amount)
            CollectionLedger ledger = new CollectionLedger();
            ledger.setOrganizationId(orgId);
            ledger.setUser(payment.getQrOwner());
            ledger.setType("COLLECTION");
            ledger.setAmount(payment.getAmount());
            ledger.setReferenceId(payment.getId());
            ledger.setNotes("Verified collection payment from customer: "
                    + (payment.getCustomer() != null ? payment.getCustomer().getName() : "Unregistered"));
            ledgerRepository.save(ledger);

            // Notify recorder
            notificationService.sendNotification(
                    payment.getRecordedBy().getId(),
                    "SUCCESS",
                    "Collection Payment Verified",
                    "Your logged payment of ₹" + payment.getAmount() + " has been verified by the QR Owner.",
                    "COLLECTION",
                    payment.getId());
        } else {
            payment.setStatus("REJECTED");
            paymentRepository.save(payment);

            // Notify recorder
            notificationService.sendNotification(
                    payment.getRecordedBy().getId(),
                    "ALERT",
                    "Collection Payment Rejected",
                    "Your logged payment of ₹" + payment.getAmount() + " was rejected by the QR Owner.",
                    "COLLECTION",
                    payment.getId());

            // Notify Admins/Owner of rejection
            List<UserOrgRole> roles = userOrgRoleRepository.findByOrganizationId(orgId);
            for (UserOrgRole r : roles) {
                if (r.isActiveMembership()
                        && r.getOrganizationId().equals(orgId)
                        && ("OWNER".equals(r.getRole()) || "ADMIN".equals(r.getRole()))) {
                    notificationService.sendNotification(
                            r.getUser().getId(),
                            "WARNING",
                            "Payment Record Rejected",
                            "A payment of ₹" + payment.getAmount() + " logged by "
                                    + payment.getRecordedBy().getEmail() + " was rejected.",
                            "COLLECTION",
                            payment.getId());
                }
            }
        }
    }

    // --- Expenses Flow ---

    @Transactional(readOnly = true)
    public List<CollectionExpenseDto> getExpenses() {
        return expenseRepository.findAll().stream().map(this::toExpenseDto).collect(Collectors.toList());
    }

    @Transactional
    @Audited(entity = "Collection", action = "RECORD_EXPENSE")
    public CollectionExpenseDto recordExpense(CollectionExpenseDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        // A negative expense would add to the employee's cash in hand instead of deducting from it
        BigDecimal amount = TaxMath.positiveAmount(dto.getAmount(), "Expense amount");
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User employee = userRepository.findById(principal.getId()).orElseThrow();

        CollectionExpense expense = new CollectionExpense();
        expense.setOrganizationId(orgId);
        expense.setUser(employee);
        expense.setCategory(dto.getCategory());
        expense.setVendor(dto.getVendor());
        expense.setAmount(amount);
        expense.setExpenseDate(dto.getExpenseDate());
        expense.setNotes(dto.getNotes());
        expense.setAttachmentUrl(dto.getAttachmentUrl());

        String userRole = getMemberRole(employee.getId(), orgId);

        // Auto-approve for Owner and Admin
        if ("OWNER".equals(userRole) || "ADMIN".equals(userRole)) {
            expense.setStatus("APPROVED");
            expense.setApprovedBy(employee);
            expense.setApprovedAt(OffsetDateTime.now());
            CollectionExpense saved = expenseRepository.save(expense);

            // Create ledger entry (- amount)
            CollectionLedger ledger = new CollectionLedger();
            ledger.setOrganizationId(orgId);
            ledger.setUser(employee);
            ledger.setType("EXPENSE");
            ledger.setAmount(amount.negate());
            ledger.setReferenceId(saved.getId());
            ledger.setNotes("Approved expense: " + dto.getCategory() + " at " + dto.getVendor());
            ledgerRepository.save(ledger);

            return toExpenseDto(saved);
        } else {
            expense.setStatus("SUBMITTED");
            CollectionExpense saved = expenseRepository.save(expense);

            // Notify Manager/Admin/Owner
            List<UserOrgRole> roles = userOrgRoleRepository.findByOrganizationId(orgId);
            for (UserOrgRole r : roles) {
                if (r.isActiveMembership()
                        && r.getOrganizationId().equals(orgId)
                        && ("OWNER".equals(r.getRole())
                                || "ADMIN".equals(r.getRole())
                                || "MANAGER".equals(r.getRole()))) {
                    notificationService.sendNotification(
                            r.getUser().getId(),
                            "INFO",
                            "New Expense Pending Approval",
                            employee.getEmail() + " submitted an expense of ₹" + amount + " for category "
                                    + dto.getCategory(),
                            "EXPENSE",
                            saved.getId());
                }
            }

            return toExpenseDto(saved);
        }
    }

    @Transactional
    @Audited(entity = "Collection", action = "APPROVE_EXPENSE")
    public void approveExpense(UUID id, boolean approve) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User verifier = userRepository.findById(principal.getId()).orElseThrow();

        CollectionExpense expense = expenseRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found"));

        if (!"SUBMITTED".equals(expense.getStatus())) {
            throw new ConflictException("Expense is already approved or rejected");
        }

        String verifierRole = getMemberRole(verifier.getId(), orgId);
        String targetRole = getMemberRole(expense.getUser().getId(), orgId);

        List<String> hierarchy = List.of("OWNER", "ADMIN", "MANAGER", "USER", "VIEWER");
        int callerLevel = hierarchy.indexOf(verifierRole);
        int targetLevel = hierarchy.indexOf(targetRole);

        if (callerLevel == -1 || targetLevel == -1 || callerLevel >= targetLevel) {
            throw new ForbiddenException("You do not have permission to approve expenses for this user role");
        }

        expense.setApprovedBy(verifier);
        expense.setApprovedAt(OffsetDateTime.now());

        if (approve) {
            expense.setStatus("APPROVED");
            expenseRepository.save(expense);

            // Create ledger entry (- amount)
            CollectionLedger ledger = new CollectionLedger();
            ledger.setOrganizationId(orgId);
            ledger.setUser(expense.getUser());
            ledger.setType("EXPENSE");
            ledger.setAmount(expense.getAmount().negate());
            ledger.setReferenceId(expense.getId());
            ledger.setNotes("Approved expense: " + expense.getCategory() + " at " + expense.getVendor());
            ledgerRepository.save(ledger);

            notificationService.sendNotification(
                    expense.getUser().getId(),
                    "SUCCESS",
                    "Expense Approved",
                    "Your expense of ₹" + expense.getAmount() + " has been approved.",
                    "EXPENSE",
                    expense.getId());
        } else {
            expense.setStatus("REJECTED");
            expenseRepository.save(expense);

            notificationService.sendNotification(
                    expense.getUser().getId(),
                    "ALERT",
                    "Expense Rejected",
                    "Your expense of ₹" + expense.getAmount() + " was rejected.",
                    "EXPENSE",
                    expense.getId());
        }
    }

    // --- Settlement Deposits Flow ---

    @Transactional(readOnly = true)
    public List<SettlementDepositDto> getDeposits() {
        return depositRepository.findAll().stream().map(this::toDepositDto).collect(Collectors.toList());
    }

    @Transactional
    @Audited(entity = "Collection", action = "RECORD_DEPOSIT")
    public SettlementDepositDto recordDeposit(SettlementDepositDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        BigDecimal amount = TaxMath.positiveAmount(dto.getAmount(), "Deposit amount");
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User employee = userRepository.findById(principal.getId()).orElseThrow();

        SettlementDeposit deposit = new SettlementDeposit();
        deposit.setOrganizationId(orgId);
        deposit.setUser(employee);
        deposit.setAmount(amount);
        deposit.setDepositDate(dto.getDepositDate());
        deposit.setReferenceNumber(dto.getReferenceNumber());
        deposit.setNotes(dto.getNotes());
        deposit.setAttachmentUrl(dto.getAttachmentUrl());
        deposit.setStatus("PENDING_APPROVAL");

        SettlementDeposit saved = depositRepository.save(deposit);

        // Notify Admins/Owner
        List<UserOrgRole> roles = userOrgRoleRepository.findByOrganizationId(orgId);
        for (UserOrgRole r : roles) {
            if (r.isActiveMembership()
                    && r.getOrganizationId().equals(orgId)
                    && ("OWNER".equals(r.getRole()) || "ADMIN".equals(r.getRole()) || "MANAGER".equals(r.getRole()))) {
                notificationService.sendNotification(
                        r.getUser().getId(),
                        "INFO",
                        "New Settlement Deposit Submitted",
                        employee.getEmail() + " logged a settlement deposit of ₹" + amount + ".",
                        "DEPOSIT",
                        saved.getId());
            }
        }

        return toDepositDto(saved);
    }

    @Transactional
    @Audited(entity = "Collection", action = "APPROVE_DEPOSIT")
    public void approveDeposit(UUID id, boolean approve) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        UserPrincipal principal = (UserPrincipal)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User verifier = userRepository.findById(principal.getId()).orElseThrow();

        SettlementDeposit deposit = depositRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deposit record not found"));

        if (!"PENDING_APPROVAL".equals(deposit.getStatus())) {
            throw new ConflictException("Deposit is already approved or rejected");
        }

        String verifierRole = getMemberRole(verifier.getId(), orgId);
        if (!"OWNER".equals(verifierRole) && !"ADMIN".equals(verifierRole) && !"MANAGER".equals(verifierRole)) {
            throw new ForbiddenException("Only Owners, Admins, and Managers can approve settlement deposits");
        }

        deposit.setApprovedBy(verifier);
        deposit.setApprovedAt(OffsetDateTime.now());

        if (approve) {
            deposit.setStatus("APPROVED");
            depositRepository.save(deposit);

            // Create ledger entry (- amount)
            CollectionLedger ledger = new CollectionLedger();
            ledger.setOrganizationId(orgId);
            ledger.setUser(deposit.getUser());
            ledger.setType("DEPOSIT");
            ledger.setAmount(deposit.getAmount().negate());
            ledger.setReferenceId(deposit.getId());
            ledger.setNotes("Approved settlement deposit, reference: " + deposit.getReferenceNumber());
            ledgerRepository.save(ledger);

            notificationService.sendNotification(
                    deposit.getUser().getId(),
                    "SUCCESS",
                    "Settlement Deposit Approved",
                    "Your settlement deposit of ₹" + deposit.getAmount() + " has been approved.",
                    "DEPOSIT",
                    deposit.getId());
        } else {
            deposit.setStatus("REJECTED");
            depositRepository.save(deposit);

            notificationService.sendNotification(
                    deposit.getUser().getId(),
                    "ALERT",
                    "Settlement Deposit Rejected",
                    "Your settlement deposit of ₹" + deposit.getAmount() + " was rejected.",
                    "DEPOSIT",
                    deposit.getId());
        }
    }

    // --- Collection Balance / Ledger Query ---

    @Transactional(readOnly = true)
    public BigDecimal getUserBalance(UUID userId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        return ledgerRepository.findByUserId(userId).stream()
                .filter(l -> l.getOrganizationId().equals(orgId))
                .map(CollectionLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional(readOnly = true)
    public List<CollectionLedgerDto> getLedger() {
        return ledgerRepository.findAll().stream().map(this::toLedgerDto).collect(Collectors.toList());
    }

    // --- Dashboard Metrics ---

    @Transactional(readOnly = true)
    public OwnerDashboardDto getOwnerDashboard() {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        List<CollectionLedger> allLedgers = ledgerRepository.findAll().stream()
                .filter(l -> l.getOrganizationId().equals(orgId))
                .collect(Collectors.toList());

        // Group balance by user
        Map<UUID, BigDecimal> balances = new HashMap<>();
        for (CollectionLedger ledger : allLedgers) {
            balances.put(
                    ledger.getUser().getId(),
                    balances.getOrDefault(ledger.getUser().getId(), BigDecimal.ZERO)
                            .add(ledger.getAmount()));
        }

        BigDecimal totalOutstanding = balances.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        List<CollectionPayment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getOrganizationId().equals(orgId))
                .collect(Collectors.toList());

        long pendingCount = payments.stream()
                .filter(p -> "PENDING_VERIFICATION".equals(p.getStatus()))
                .count();
        BigDecimal pendingSum = payments.stream()
                .filter(p -> "PENDING_VERIFICATION".equals(p.getStatus()))
                .map(CollectionPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ZoneId zone = organizationClock.zoneOf(orgId);
        LocalDate today = LocalDate.now(zone);

        BigDecimal collectionsToday = payments.stream()
                .filter(p -> "VERIFIED".equals(p.getStatus())
                        && p.getVerifiedAt() != null
                        && OrganizationClock.dayOf(p.getVerifiedAt(), zone).isEqual(today))
                .map(CollectionPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal depositsToday = depositRepository.findAll().stream()
                .filter(d -> d.getOrganizationId().equals(orgId)
                        && "APPROVED".equals(d.getStatus())
                        && d.getApprovedAt() != null
                        && OrganizationClock.dayOf(d.getApprovedAt(), zone).isEqual(today))
                .map(SettlementDeposit::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expensesToday = expenseRepository.findAll().stream()
                .filter(e -> e.getOrganizationId().equals(orgId)
                        && "APPROVED".equals(e.getStatus())
                        && e.getApprovedAt() != null
                        && OrganizationClock.dayOf(e.getApprovedAt(), zone).isEqual(today))
                .map(CollectionExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top collectors
        List<Map<String, Object>> topCollectorsList = new ArrayList<>();
        Map<User, BigDecimal> userCollections = new HashMap<>();
        for (CollectionPayment p : payments) {
            if ("VERIFIED".equals(p.getStatus())) {
                userCollections.put(
                        p.getQrOwner(),
                        userCollections
                                .getOrDefault(p.getQrOwner(), BigDecimal.ZERO)
                                .add(p.getAmount()));
            }
        }
        userCollections.entrySet().stream()
                .sorted(Map.Entry.<User, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("email", entry.getKey().getEmail());
                    map.put(
                            "name",
                            entry.getKey().getFirstName() + " " + entry.getKey().getLastName());
                    map.put("amount", entry.getValue());
                    topCollectorsList.add(map);
                });

        // Users with high outstanding balances
        List<Map<String, Object>> highOutstandingList = new ArrayList<>();
        balances.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> {
                    User user = userRepository.findById(entry.getKey()).orElse(null);
                    if (user != null) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("email", user.getEmail());
                        map.put("name", user.getFirstName() + " " + user.getLastName());
                        map.put("amount", entry.getValue());
                        highOutstandingList.add(map);
                    }
                });

        return new OwnerDashboardDto(
                totalOutstanding,
                pendingCount,
                pendingSum,
                collectionsToday,
                depositsToday,
                expensesToday,
                topCollectorsList,
                highOutstandingList);
    }

    @Transactional(readOnly = true)
    public UserDashboardDto getUserDashboard(UUID userId) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        BigDecimal balance = getUserBalance(userId);

        List<CollectionPayment> payments = paymentRepository.findAll().stream()
                .filter(p -> p.getOrganizationId().equals(orgId)
                        && p.getQrOwner().getId().equals(userId))
                .collect(Collectors.toList());

        long pendingCount = payments.stream()
                .filter(p -> "PENDING_VERIFICATION".equals(p.getStatus()))
                .count();

        ZoneId zone = organizationClock.zoneOf(orgId);
        LocalDate today = LocalDate.now(zone);

        BigDecimal todayCollections = payments.stream()
                .filter(p -> "VERIFIED".equals(p.getStatus())
                        && p.getVerifiedAt() != null
                        && OrganizationClock.dayOf(p.getVerifiedAt(), zone).isEqual(today))
                .map(CollectionPayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayExpenses = expenseRepository.findAll().stream()
                .filter(e -> e.getOrganizationId().equals(orgId)
                        && e.getUser().getId().equals(userId)
                        && "APPROVED".equals(e.getStatus())
                        && e.getApprovedAt() != null
                        && OrganizationClock.dayOf(e.getApprovedAt(), zone).isEqual(today))
                .map(CollectionExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal todayDeposits = depositRepository.findAll().stream()
                .filter(d -> d.getOrganizationId().equals(orgId)
                        && d.getUser().getId().equals(userId)
                        && "APPROVED".equals(d.getStatus())
                        && d.getApprovedAt() != null
                        && OrganizationClock.dayOf(d.getApprovedAt(), zone).isEqual(today))
                .map(SettlementDeposit::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new UserDashboardDto(balance, pendingCount, todayCollections, todayExpenses, todayDeposits);
    }

    // --- Helpers / Mappers ---

    private String getMemberRole(UUID userId, UUID orgId) {
        return userOrgRoleRepository
                .findByUserIdAndOrganizationId(userId, orgId)
                .map(UserOrgRole::getRole)
                .orElse("USER");
    }

    private CollectionQrCodeDto toQrDto(CollectionQrCode entity) {
        String currentTenant = TenantContext.getCurrentTenant();
        UUID currentOrgId = currentTenant != null ? UUID.fromString(currentTenant) : null;
        boolean isMasterShared =
                currentOrgId != null && !entity.getOrganizationId().equals(currentOrgId);

        CollectionQrCodeDto dto = new CollectionQrCodeDto();
        dto.setId(entity.getId());
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            dto.setUserEmail(entity.getUser().getEmail());
            dto.setUserFirstName(entity.getUser().getFirstName());
            dto.setUserLastName(entity.getUser().getLastName());
        }
        dto.setNickname(entity.getNickname());
        dto.setQrImageUrl(entity.getQrImageUrl());
        dto.setIsActive(entity.getIsActive());
        dto.setOrganizationId(entity.getOrganizationId());
        dto.setIsShared(entity.getIsShared());
        dto.setIsMasterShared(isMasterShared);
        return dto;
    }

    private CollectionPaymentDto toPaymentDto(CollectionPayment entity) {
        CollectionPaymentDto dto = new CollectionPaymentDto();
        dto.setId(entity.getId());
        dto.setCustomerId(entity.getCustomer() != null ? entity.getCustomer().getId() : null);
        dto.setCustomerName(entity.getCustomer() != null ? entity.getCustomer().getName() : null);
        dto.setQrCodeId(entity.getQrCode().getId());
        dto.setQrCodeNickname(entity.getQrCode().getNickname());
        dto.setRecordedById(entity.getRecordedBy().getId());
        dto.setRecordedByEmail(entity.getRecordedBy().getEmail());
        dto.setQrOwnerId(entity.getQrOwner().getId());
        dto.setQrOwnerEmail(entity.getQrOwner().getEmail());
        dto.setAmount(entity.getAmount());
        dto.setPlace(entity.getPlace());
        dto.setRecordedAt(entity.getRecordedAt());
        dto.setUtrNumber(entity.getUtrNumber());
        dto.setReferenceNumber(entity.getReferenceNumber());
        dto.setScreenshotUrl(entity.getScreenshotUrl());
        dto.setStatus(entity.getStatus());
        dto.setVerifiedById(
                entity.getVerifiedBy() != null ? entity.getVerifiedBy().getId() : null);
        dto.setVerifiedAt(entity.getVerifiedAt());
        dto.setRemarks(entity.getRemarks());
        dto.setOrganizationId(entity.getOrganizationId());
        dto.setCollectingOrganizationId(entity.getCollectingOrganizationId());
        return dto;
    }

    private CollectionExpenseDto toExpenseDto(CollectionExpense entity) {
        return new CollectionExpenseDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getEmail(),
                entity.getCategory(),
                entity.getVendor(),
                entity.getAmount(),
                entity.getExpenseDate(),
                entity.getNotes(),
                entity.getAttachmentUrl(),
                entity.getStatus(),
                entity.getApprovedBy() != null ? entity.getApprovedBy().getId() : null,
                entity.getApprovedAt());
    }

    private SettlementDepositDto toDepositDto(SettlementDeposit entity) {
        return new SettlementDepositDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getEmail(),
                entity.getAmount(),
                entity.getDepositDate(),
                entity.getReferenceNumber(),
                entity.getNotes(),
                entity.getAttachmentUrl(),
                entity.getStatus(),
                entity.getApprovedBy() != null ? entity.getApprovedBy().getId() : null,
                entity.getApprovedAt());
    }

    private CollectionLedgerDto toLedgerDto(CollectionLedger entity) {
        return new CollectionLedgerDto(
                entity.getId(),
                entity.getUser().getId(),
                entity.getUser().getEmail(),
                entity.getType(),
                entity.getAmount(),
                entity.getReferenceId(),
                entity.getNotes(),
                entity.getCreatedAt());
    }
}
