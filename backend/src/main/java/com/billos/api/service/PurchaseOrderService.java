package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.PurchaseOrderDto;
import com.billos.api.dto.PurchaseOrderLineDto;
import com.billos.api.entity.*;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.PurchaseOrderMapper;
import com.billos.api.repository.PurchaseOrderRepository;
import com.billos.api.repository.SupplierRepository;
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
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SharedEntityResolver sharedEntityResolver;
    private final SupplierRepository supplierRepository;
    private final TaxRateRepository taxRateRepository;
    private final PurchaseOrderMapper purchaseOrderMapper;

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll().stream()
                .map(purchaseOrderMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getPurchaseOrderById(UUID id) {
        return purchaseOrderRepository
                .findById(id)
                .map(purchaseOrderMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));
    }

    @Transactional
    @Audited(entity = "PurchaseOrder", action = "CREATE")
    public PurchaseOrderDto createPurchaseOrder(PurchaseOrderDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Supplier supplier = supplierRepository
                .findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        PurchaseOrder po = new PurchaseOrder();
        po.setOrganizationId(orgId);
        po.setSupplier(supplier);
        po.setPoNumber(dto.getPoNumber());
        po.setOrderDate(dto.getOrderDate());
        po.setExpectedDeliveryDate(dto.getExpectedDeliveryDate());
        po.setStatus(PurchaseOrderStatus.DRAFT);
        po.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (PurchaseOrderLineDto lineDto : dto.getLines()) {
            Product product = sharedEntityResolver.accessibleProduct(lineDto.getProductId());

            TaxRate taxRate = null;
            if (lineDto.getTaxRateId() != null) {
                taxRate = taxRateRepository
                        .findById(lineDto.getTaxRateId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));
            }

            PurchaseOrderLine line = new PurchaseOrderLine();
            line.setProduct(product);
            line.setTaxRate(taxRate);
            line.setQuantity(lineDto.getQuantity());
            line.setUnitPrice(lineDto.getUnitPrice());

            // Re-calculate totals on backend for safety
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

            po.addLine(line);
        }

        po.setSubtotal(subtotal);
        po.setTaxTotal(taxTotal);
        po.setTotalAmount(subtotal.add(taxTotal));

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        return purchaseOrderMapper.toDto(saved);
    }

    @Transactional
    @Audited(entity = "PurchaseOrder", action = "ISSUE")
    public PurchaseOrderDto issueOrder(UUID id) {
        PurchaseOrder po = purchaseOrderRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase Order not found"));
        po.setStatus(PurchaseOrderStatus.ISSUED);
        return purchaseOrderMapper.toDto(purchaseOrderRepository.save(po));
    }
}
