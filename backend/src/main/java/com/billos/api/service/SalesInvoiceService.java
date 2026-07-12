package com.billos.api.service;

import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final OrganizationRepository organizationRepository;
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

        Organization org = organizationRepository
                .findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        boolean isInterState = org.getState() != null
                && customer.getBillingState() != null
                && !org.getState().equalsIgnoreCase(customer.getBillingState());

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

                if (isInterState) {
                    line.setIgstAmount(lineTax);
                } else {
                    BigDecimal halfTax = lineTax.divide(new BigDecimal("2"));
                    line.setCgstAmount(halfTax);
                    line.setSgstAmount(halfTax);
                }

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

        // Update customer outstanding balance
        Customer customer = invoice.getCustomer();
        customer.setOutstandingBalance(customer.getOutstandingBalance().add(invoice.getTotalAmount()));
        customerRepository.save(customer);

        return salesInvoiceMapper.toDto(savedInvoice);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> generateEInvoiceJson(UUID id) {
        SalesInvoice invoice =
                salesInvoiceRepository.findById(id).orElseThrow(() -> new RuntimeException("Invoice not found"));

        Organization org = organizationRepository
                .findById(invoice.getOrganizationId())
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        Customer customer = invoice.getCustomer();

        Map<String, Object> eInvoice = new HashMap<>();

        // Document Details
        Map<String, Object> docDtls = new HashMap<>();
        docDtls.put("Typ", "INV");
        docDtls.put("No", invoice.getInvoiceNumber());
        docDtls.put("Dt", invoice.getInvoiceDate().toString());
        eInvoice.put("DocDtls", docDtls);

        // Seller Details
        Map<String, Object> sellerDtls = new HashMap<>();
        sellerDtls.put("Gstin", org.getGstin());
        sellerDtls.put("LglNm", org.getLegalName() != null ? org.getLegalName() : org.getName());
        sellerDtls.put("Addr1", org.getAddressLine1());
        sellerDtls.put("Loc", org.getCity());
        sellerDtls.put("Pin", org.getPincode());
        sellerDtls.put("Stcd", org.getState()); // Needs to be state code in real life
        eInvoice.put("SellerDtls", sellerDtls);

        // Buyer Details
        Map<String, Object> buyerDtls = new HashMap<>();
        buyerDtls.put("Gstin", customer.getGstin() != null ? customer.getGstin() : "URP");
        buyerDtls.put("LglNm", customer.getName());
        buyerDtls.put("Addr1", customer.getBillingAddressLine1());
        buyerDtls.put("Loc", customer.getBillingCity());
        buyerDtls.put("Pin", customer.getBillingPincode());
        buyerDtls.put("Stcd", customer.getBillingState());
        eInvoice.put("BuyerDtls", buyerDtls);

        // Item List & HSN Summary
        List<Map<String, Object>> itemList = invoice.getLines().stream()
                .map(line -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("SlNo", line.getId().toString());
                    item.put("PrdDesc", line.getProduct().getName());
                    item.put("IsServc", "N");
                    item.put("HsnCd", line.getProduct().getHsnSac());
                    item.put("Qty", line.getQuantity());
                    item.put("Unit", "NOS");
                    item.put("UnitPrice", line.getUnitPrice());
                    item.put("TotAmt", line.getQuantity().multiply(line.getUnitPrice()));
                    item.put(
                            "GstRt",
                            line.getTaxRate() != null ? line.getTaxRate().getRate() : 0);
                    item.put("IgstAmt", line.getIgstAmount());
                    item.put("CgstAmt", line.getCgstAmount());
                    item.put("SgstAmt", line.getSgstAmount());
                    item.put("TotItemVal", line.getLineTotal());
                    return item;
                })
                .collect(Collectors.toList());

        eInvoice.put("ItemList", itemList);

        // Value Details
        Map<String, Object> valDtls = new HashMap<>();
        valDtls.put("AssVal", invoice.getSubtotal());
        valDtls.put(
                "CgstVal",
                invoice.getLines().stream()
                        .map(SalesInvoiceLine::getCgstAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        valDtls.put(
                "SgstVal",
                invoice.getLines().stream()
                        .map(SalesInvoiceLine::getSgstAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        valDtls.put(
                "IgstVal",
                invoice.getLines().stream()
                        .map(SalesInvoiceLine::getIgstAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add));
        valDtls.put("TotInvVal", invoice.getTotalAmount());
        eInvoice.put("ValDtls", valDtls);

        return eInvoice;
    }
}
