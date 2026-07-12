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
import com.billos.api.entity.SalesInvoice;
import com.billos.api.mapper.CustomerMapper;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.mapper.SupplierMapper;
import com.billos.api.repository.CustomerRepository;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import com.billos.api.repository.SupplierRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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

    @Transactional(readOnly = true)
    public List<SalesInvoiceDto> getSalesRegister(LocalDate startDate, LocalDate endDate) {
        return salesInvoiceRepository.findAll().stream()
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

        BigDecimal revenue = getSalesRegister(startDate, endDate).stream()
                .filter(inv -> !inv.getStatus().name().equals("VOID"))
                .map(SalesInvoiceDto::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal purchases = getPurchaseRegister(startDate, endDate).stream()
                .filter(bill -> !bill.getStatus().name().equals("VOID"))
                .map(PurchaseBillDto::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        pnl.setTotalRevenue(revenue);
        pnl.setTotalPurchases(purchases);
        pnl.setNetProfit(revenue.subtract(purchases));

        return pnl;
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getOutstandingReceivables() {
        return customerRepository.findAll().stream()
                .filter(c -> c.getOutstandingBalance() != null
                        && c.getOutstandingBalance().compareTo(BigDecimal.ZERO) > 0)
                .map(customerMapper::toDto)
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
                .filter(inv -> !inv.getStatus().name().equals("VOID"))
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
                .filter(inv -> !inv.getStatus().name().equals("VOID"))
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

        return dto;
    }
}
