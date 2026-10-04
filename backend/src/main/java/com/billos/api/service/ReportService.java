package com.billos.api.service;

import com.billos.api.dto.CustomerDto;
import com.billos.api.dto.Gstr1Dto;
import com.billos.api.dto.Gstr3bDto;
import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.dto.SupplierDto;
import com.billos.api.entity.PurchaseBill;
import com.billos.api.entity.PurchaseBillStatus;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.mapper.CustomerMapper;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.mapper.SupplierMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReportService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final PurchaseBillRepository purchaseBillRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryService inventoryService;
    private final SalesInvoiceMapper salesInvoiceMapper;
    private final PurchaseBillMapper purchaseBillMapper;
    private final CustomerMapper customerMapper;
    private final SupplierMapper supplierMapper;
    private final CustomerBalanceService customerBalanceService;
    private final OrganizationService organizationService;

    @Transactional(readOnly = true)
    public List<SalesInvoiceDto> getSalesRegister(LocalDate startDate, LocalDate endDate) {
        // A register lists issued documents; drafts aren't invoices yet
        return salesInvoiceRepository.findAll().stream()
                .filter(inv -> inv.getStatus() != SalesInvoiceStatus.DRAFT)
                .filter(inv -> startDate == null || !inv.getInvoiceDate().isBefore(startDate))
                .filter(inv -> endDate == null || !inv.getInvoiceDate().isAfter(endDate))
                .map(salesInvoiceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseBillDto> getPurchaseRegister(LocalDate startDate, LocalDate endDate) {
        return purchaseBillRepository.findAll().stream()
                .filter(bill -> startDate == null || !bill.getBillDate().isBefore(startDate))
                .filter(bill -> endDate == null || !bill.getBillDate().isAfter(endDate))
                .map(purchaseBillMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InventoryLevelDto> getStockSummary() {
        return inventoryService.getAllInventoryLevels();
    }

    @Transactional(readOnly = true)
    public PnlDto getProfitAndLoss(LocalDate startDate, LocalDate endDate) {
        PnlDto pnl = new PnlDto();

        // Taxable values (subtotal), not totals: GST collected isn't revenue and input GST isn't a cost —
        // both are pass-through liabilities/credits settled with the government.
        BigDecimal revenue = getSalesRegister(startDate, endDate).stream()
                .filter(inv -> inv.getStatus() != SalesInvoiceStatus.VOID)
                .map(SalesInvoiceDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal purchases = getPurchaseRegister(startDate, endDate).stream()
                .filter(bill -> bill.getStatus() != PurchaseBillStatus.VOID)
                .map(PurchaseBillDto::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        pnl.setTotalRevenue(revenue);
        pnl.setTotalPurchases(purchases);
        pnl.setNetProfit(revenue.subtract(purchases));

        return pnl;
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getOutstandingReceivables() {
        // Customer has no @TenantId (branch sharing): list the ones this org can see, with what each owes this org
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        var balance = customerBalanceService.forCurrentOrg();
        return customerRepository
                .findAccessibleCustomers(orgId, organizationService.resolvePrimaryOrgId(orgId))
                .stream()
                .map(c -> {
                    CustomerDto dto = customerMapper.toDto(c);
                    dto.setOutstandingBalance(balance.apply(c));
                    return dto;
                })
                .filter(dto -> dto.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SupplierDto> getOutstandingPayables() {
        return supplierRepository.findAll().stream()
                .filter(s -> s.getOutstandingBalance() != null
                        && s.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(supplierMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Gstr1Dto> getGstr1(LocalDate startDate, LocalDate endDate) {
        return salesInvoiceRepository.findAll().stream()
                .filter(inv -> startDate == null || !inv.getInvoiceDate().isBefore(startDate))
                .filter(inv -> endDate == null || !inv.getInvoiceDate().isAfter(endDate))
                .filter(ReportService::isReportableInvoice)
                .map(inv -> {
                    Gstr1Dto dto = new Gstr1Dto();
                    dto.setCustomerGstin(inv.getCustomer().getGstin());
                    dto.setCustomerName(inv.getCustomer().getName());
                    dto.setInvoiceNumber(inv.getInvoiceNumber());
                    dto.setInvoiceDate(inv.getInvoiceDate().toString());
                    dto.setTaxableValue(inv.getSubtotal());

                    BigDecimal cgst = BigDecimal.ZERO;
                    BigDecimal sgst = BigDecimal.ZERO;
                    BigDecimal igst = BigDecimal.ZERO;

                    for (var line : inv.getLines()) {
                        if (line.getCgstAmount() != null) cgst = cgst.add(line.getCgstAmount());
                        if (line.getSgstAmount() != null) sgst = sgst.add(line.getSgstAmount());
                        if (line.getIgstAmount() != null) igst = igst.add(line.getIgstAmount());
                    }

                    dto.setCgstAmount(cgst);
                    dto.setSgstAmount(sgst);
                    dto.setIgstAmount(igst);
                    dto.setTotalAmount(inv.getTotalAmount());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Gstr3bDto getGstr3b(LocalDate startDate, LocalDate endDate) {
        Gstr3bDto dto = new Gstr3bDto();

        List<SalesInvoice> sales = salesInvoiceRepository.findAll().stream()
                .filter(inv -> startDate == null || !inv.getInvoiceDate().isBefore(startDate))
                .filter(inv -> endDate == null || !inv.getInvoiceDate().isAfter(endDate))
                .filter(ReportService::isReportableInvoice)
                .collect(Collectors.toList());

        for (SalesInvoice inv : sales) {
            dto.setOutwardTaxableValue(dto.getOutwardTaxableValue().add(inv.getSubtotal()));
            dto.setOutwardTotalTax(dto.getOutwardTotalTax().add(inv.getTaxTotal()));
            for (var line : inv.getLines()) {
                if (line.getCgstAmount() != null)
                    dto.setOutwardCgst(dto.getOutwardCgst().add(line.getCgstAmount()));
                if (line.getSgstAmount() != null)
                    dto.setOutwardSgst(dto.getOutwardSgst().add(line.getSgstAmount()));
                if (line.getIgstAmount() != null)
                    dto.setOutwardIgst(dto.getOutwardIgst().add(line.getIgstAmount()));
            }
        }

        List<PurchaseBill> purchases = purchaseBillRepository.findAll().stream()
                .filter(bill -> startDate == null || !bill.getBillDate().isBefore(startDate))
                .filter(bill -> endDate == null || !bill.getBillDate().isAfter(endDate))
                .filter(bill -> !bill.getStatus().name().equals("VOID"))
                .collect(Collectors.toList());

        for (PurchaseBill bill : purchases) {
            dto.setInwardTaxableValue(dto.getInwardTaxableValue().add(bill.getSubtotal()));
            dto.setInwardTotalTax(dto.getInwardTotalTax().add(bill.getTaxTotal()));
            for (var line : bill.getLines()) {
                if (line.getCgstAmount() != null)
                    dto.setInwardCgst(dto.getInwardCgst().add(line.getCgstAmount()));
                if (line.getSgstAmount() != null)
                    dto.setInwardSgst(dto.getInwardSgst().add(line.getSgstAmount()));
                if (line.getIgstAmount() != null)
                    dto.setInwardIgst(dto.getInwardIgst().add(line.getIgstAmount()));
            }
        }

        applyItcSetOff(dto);
        return dto;
    }

    /**
     * Sets the period's input tax credit off against its output tax in the order GST law prescribes (s.49, rule 88A)
     * and records, per head, the tax left to pay in cash and the credit carried forward:
     *
     * <ol>
     *   <li>IGST credit first against IGST, then against CGST and SGST — it must be used up before any CGST or SGST
     *       credit is;
     *   <li>CGST credit against CGST, then IGST — never SGST;
     *   <li>SGST credit against SGST, then IGST — never CGST.
     * </ol>
     *
     * <p>Remaining IGST credit goes to the CGST/SGST shortfalls (what their own credit can't cover) first, which keeps
     * the cash outgo at its minimum. Netting total output tax against total credit instead understates the cash due
     * whenever, say, CGST credit exceeds CGST output while SGST output exceeds SGST credit.
     */
    static void applyItcSetOff(Gstr3bDto dto) {
        TaxHead igst = new TaxHead(dto.getOutwardIgst(), dto.getInwardIgst());
        TaxHead cgst = new TaxHead(dto.getOutwardCgst(), dto.getInwardCgst());
        TaxHead sgst = new TaxHead(dto.getOutwardSgst(), dto.getInwardSgst());

        igst.payFrom(igst);
        cgst.payFrom(igst, cgst.shortfall());
        sgst.payFrom(igst, sgst.shortfall());
        cgst.payFrom(igst);
        sgst.payFrom(igst);

        cgst.payFrom(cgst);
        igst.payFrom(cgst);

        sgst.payFrom(sgst);
        igst.payFrom(sgst);

        dto.setCashPayableIgst(igst.due);
        dto.setCashPayableCgst(cgst.due);
        dto.setCashPayableSgst(sgst.due);
        dto.setTotalCashPayable(igst.due.add(cgst.due).add(sgst.due));
        dto.setItcCarryForwardIgst(igst.credit);
        dto.setItcCarryForwardCgst(cgst.credit);
        dto.setItcCarryForwardSgst(sgst.credit);
        dto.setTotalItcCarryForward(igst.credit.add(cgst.credit).add(sgst.credit));
    }

    /** One GST head during set-off: output tax still due and input tax credit still unused. */
    private static final class TaxHead {
        private BigDecimal due;
        private BigDecimal credit;

        TaxHead(BigDecimal due, BigDecimal credit) {
            this.due = due != null ? due : BigDecimal.ZERO;
            this.credit = credit != null ? credit : BigDecimal.ZERO;
        }

        BigDecimal shortfall() {
            return due.subtract(credit).max(BigDecimal.ZERO);
        }

        void payFrom(TaxHead source) {
            payFrom(source, due);
        }

        /** Pays up to {@code limit} of this head's due from {@code source}'s credit. */
        void payFrom(TaxHead source, BigDecimal limit) {
            BigDecimal used = limit.min(due).min(source.credit);
            due = due.subtract(used);
            source.credit = source.credit.subtract(used);
        }
    }

    /** Invoices that count for GST returns: issued (fully, partly or not yet paid), never drafts or voids. */
    static boolean isReportableInvoice(SalesInvoice inv) {
        return inv.getStatus() != SalesInvoiceStatus.DRAFT && inv.getStatus() != SalesInvoiceStatus.VOID;
    }
}
