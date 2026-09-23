package com.billos.api.service;

import com.billos.api.dto.SalesOrderDto;
import com.billos.api.dto.SalesOrderLineDto;
import com.billos.api.entity.*;
import com.billos.api.mapper.SalesOrderMapper;
import com.billos.api.repository.SalesOrderRepository;
import com.billos.api.repository.TaxRateRepository;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final SharedEntityResolver sharedEntityResolver;
    private final TaxRateRepository taxRateRepository;
    private final SalesOrderMapper salesOrderMapper;
    private final SequenceGeneratorService sequenceGeneratorService;

    @Transactional(readOnly = true)
    public List<SalesOrderDto> getAllSalesOrders() {
        return salesOrderRepository.findAll().stream()
                .map(salesOrderMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalesOrderDto getSalesOrderById(UUID id) {
        return salesOrderRepository
                .findById(id)
                .map(salesOrderMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Sales Order not found"));
    }

    @Transactional
    public SalesOrderDto createSalesOrder(SalesOrderDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Customer customer = sharedEntityResolver.accessibleCustomer(dto.getCustomerId());

        SalesOrder so = new SalesOrder();
        so.setOrganizationId(orgId);
        so.setCustomer(customer);
        so.setSoNumber(sequenceGeneratorService.getNextDocumentNumber(DocumentType.SALES_ORDER));
        so.setOrderDate(dto.getOrderDate());
        so.setStatus(SalesOrderStatus.DRAFT);
        so.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesOrderLineDto lineDto : dto.getLines()) {
            Product product = sharedEntityResolver.accessibleProduct(lineDto.getProductId());

            TaxRate taxRate = null;
            if (lineDto.getTaxRateId() != null) {
                taxRate = taxRateRepository
                        .findById(lineDto.getTaxRateId())
                        .orElseThrow(() -> new RuntimeException("Tax Rate not found"));
            }

            SalesOrderLine line = new SalesOrderLine();
            line.setProduct(product);
            line.setTaxRate(taxRate);
            line.setQuantity(lineDto.getQuantity());
            line.setUnitPrice(lineDto.getUnitPrice());

            BigDecimal lineBase = TaxMath.money(line.getQuantity().multiply(line.getUnitPrice()));
            subtotal = subtotal.add(lineBase);

            if (taxRate != null) {
                BigDecimal lineTax = TaxMath.percentOf(lineBase, taxRate.getRate());
                line.setTaxAmount(lineTax);
                taxTotal = taxTotal.add(lineTax);
                line.setLineTotal(lineBase.add(lineTax));
            } else {
                line.setTaxAmount(BigDecimal.ZERO);
                line.setLineTotal(lineBase);
            }

            so.addLine(line);
        }

        so.setSubtotal(subtotal);
        so.setTaxTotal(taxTotal);
        so.setTotalAmount(subtotal.add(taxTotal));

        SalesOrder saved = salesOrderRepository.save(so);
        return salesOrderMapper.toDto(saved);
    }
}
