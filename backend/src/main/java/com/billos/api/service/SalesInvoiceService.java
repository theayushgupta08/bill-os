package com.billos.api.service;

import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.*;
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
public class SalesInvoiceService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final TaxRateRepository taxRateRepository;
    private final SalesInvoiceMapper salesInvoiceMapper;
    private final SequenceGeneratorService sequenceGeneratorService;

    private final InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<SalesInvoiceDto> getAllSalesInvoices() {
        return salesInvoiceRepository.findAll().stream()
                .map(salesInvoiceMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalesInvoiceDto getSalesInvoiceById(UUID id) {
        return salesInvoiceRepository
                .findById(id)
                .map(salesInvoiceMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Sales Invoice not found"));
    }

    @Transactional
    public SalesInvoiceDto createSalesInvoice(SalesInvoiceDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Customer customer = customerRepository
                .findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        SalesInvoice invoice = new SalesInvoice();
        invoice.setOrganizationId(orgId);
        invoice.setCustomer(customer);

        if (dto.getSoId() != null) {
            SalesOrder so = salesOrderRepository
                    .findById(dto.getSoId())
                    .orElseThrow(() -> new RuntimeException("SO not found"));
            // invoice.setSalesOrder(so); // Left commented out as not mapped directly in basic implementation
            so.setStatus(SalesOrderStatus.INVOICED);
            salesOrderRepository.save(so);
        }

        invoice.setInvoiceNumber(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE));
        invoice.setInvoiceDate(dto.getInvoiceDate());
        invoice.setDueDate(dto.getDueDate());

        SalesInvoiceStatus initialStatus = dto.getStatus() != null ? dto.getStatus() : SalesInvoiceStatus.DRAFT;
        invoice.setStatus(initialStatus);
        invoice.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesInvoiceLineDto lineDto : dto.getLines()) {
            Product product = productRepository
                    .findById(lineDto.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            Warehouse warehouse = warehouseRepository
                    .findById(lineDto.getWarehouseId())
                    .orElseThrow(() -> new RuntimeException("Warehouse not found"));

            TaxRate taxRate = null;
            if (lineDto.getTaxRateId() != null) {
                taxRate = taxRateRepository
                        .findById(lineDto.getTaxRateId())
                        .orElseThrow(() -> new RuntimeException("Tax Rate not found"));
            }

            SalesInvoiceLine line = new SalesInvoiceLine();
            line.setProduct(product);
            line.setWarehouse(warehouse);
            line.setTaxRate(taxRate);
            line.setQuantity(lineDto.getQuantity());
            line.setUnitPrice(lineDto.getUnitPrice());

            BigDecimal lineBase = line.getQuantity().multiply(line.getUnitPrice());
            subtotal = subtotal.add(lineBase);

            if (taxRate != null) {
                BigDecimal lineTax = lineBase.multiply(taxRate.getRate()).divide(new BigDecimal("100"));
                line.setTaxAmount(lineTax);
                taxTotal = taxTotal.add(lineTax);
                line.setLineTotal(lineBase.add(lineTax));
            } else {
                line.setTaxAmount(BigDecimal.ZERO);
                line.setLineTotal(lineBase);
            }

            invoice.addLine(line);

            if (initialStatus == SalesInvoiceStatus.ISSUED) {
                // AUTOMATIC STOCK DEDUCTION
                StockMovementDto movement = new StockMovementDto();
                movement.setWarehouseId(warehouse.getId());
                movement.setProductId(product.getId());
                movement.setMovementType(MovementType.OUT);
                movement.setQuantity(line.getQuantity());
                movement.setUnitCost(line.getUnitPrice());
                movement.setReferenceType("SALES_INVOICE");
                movement.setReason("Sold via Invoice " + invoice.getInvoiceNumber());

                inventoryService.adjustStock(movement);
            }
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setTotalAmount(subtotal.add(taxTotal));

        SalesInvoice savedInvoice = salesInvoiceRepository.save(invoice);

        return salesInvoiceMapper.toDto(savedInvoice);
    }

    @Transactional
    public SalesInvoiceDto issueInvoice(UUID id) {
        SalesInvoice invoice =
                salesInvoiceRepository.findById(id).orElseThrow(() -> new RuntimeException("Invoice not found"));

        if (invoice.getStatus() != SalesInvoiceStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT invoices can be issued");
        }

        invoice.setStatus(SalesInvoiceStatus.ISSUED);

        for (SalesInvoiceLine line : invoice.getLines()) {
            StockMovementDto movement = new StockMovementDto();
            movement.setWarehouseId(line.getWarehouse().getId());
            movement.setProductId(line.getProduct().getId());
            movement.setMovementType(MovementType.OUT);
            movement.setQuantity(line.getQuantity());
            movement.setUnitCost(line.getUnitPrice());
            movement.setReferenceType("SALES_INVOICE");
            movement.setReason("Sold via Invoice " + invoice.getInvoiceNumber());

            inventoryService.adjustStock(movement);
        }

        SalesInvoice savedInvoice = salesInvoiceRepository.save(invoice);
        return salesInvoiceMapper.toDto(savedInvoice);
    }
}
