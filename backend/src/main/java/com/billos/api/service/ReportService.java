package com.billos.api.service;

import com.billos.api.dto.InventoryLevelDto;
import com.billos.api.dto.PnlDto;
import com.billos.api.dto.PurchaseBillDto;
import com.billos.api.dto.SalesInvoiceDto;
import com.billos.api.mapper.PurchaseBillMapper;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.PurchaseBillRepository;
import com.billos.api.repository.SalesInvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ReportService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final PurchaseBillRepository purchaseBillRepository;
    private final InventoryService inventoryService;
    private final SalesInvoiceMapper salesInvoiceMapper;
    private final PurchaseBillMapper purchaseBillMapper;

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
}
