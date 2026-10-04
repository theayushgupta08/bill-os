package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.*;
import com.billos.api.entity.*;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.SalesInvoiceMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class SalesInvoiceService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final SharedEntityResolver sharedEntityResolver;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
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
                .orElseThrow(() -> new ResourceNotFoundException("Sales Invoice not found"));
    }

    @Transactional
    @Audited(entity = "SalesInvoice", action = "CREATE")
    public SalesInvoiceDto createSalesInvoice(SalesInvoiceDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Customer customer = sharedEntityResolver.accessibleCustomer(dto.getCustomerId());

        Organization org = organizationRepository
                .findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        boolean isInterState =
                GstStates.isInterState(org.getState(), org.getGstin(), customer.getBillingState(), customer.getGstin());

        SalesInvoice invoice = new SalesInvoice();
        invoice.setOrganizationId(orgId);
        invoice.setCustomer(customer);

        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw new BadRequestException("An invoice needs at least one line");
        }

        // Clients may only create drafts or issue immediately; PARTIAL/PAID/VOID are reached via payments/voiding
        SalesInvoiceStatus initialStatus = dto.getStatus() != null ? dto.getStatus() : SalesInvoiceStatus.DRAFT;
        if (initialStatus != SalesInvoiceStatus.DRAFT && initialStatus != SalesInvoiceStatus.ISSUED) {
            throw new BadRequestException("A new invoice can only be DRAFT or ISSUED, not " + initialStatus);
        }

        if (dto.getSoId() != null) {
            SalesOrder so = salesOrderRepository
                    .findById(dto.getSoId())
                    .orElseThrow(() -> new ResourceNotFoundException("SO not found"));
            if (so.getStatus() == SalesOrderStatus.INVOICED || so.getStatus() == SalesOrderStatus.CANCELLED) {
                throw new ConflictException("Sales order " + so.getSoNumber() + " is already " + so.getStatus());
            }
            // invoice.setSalesOrder(so); // Left commented out as not mapped directly in basic implementation
            so.setStatus(SalesOrderStatus.INVOICED);
            salesOrderRepository.save(so);
        }

        invoice.setInvoiceNumber(sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE));
        invoice.setInvoiceDate(dto.getInvoiceDate());
        invoice.setDueDate(dto.getDueDate());

        invoice.setStatus(initialStatus);
        invoice.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (SalesInvoiceLineDto lineDto : dto.getLines()) {
            Product product = sharedEntityResolver.accessibleProduct(lineDto.getProductId());
            Warehouse warehouse = warehouseRepository
                    .findById(lineDto.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));

            TaxRate taxRate = null;
            if (lineDto.getTaxRateId() != null) {
                taxRate = taxRateRepository
                        .findById(lineDto.getTaxRateId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));
            }

            SalesInvoiceLine line = new SalesInvoiceLine();
            line.setProduct(product);
            line.setWarehouse(warehouse);
            line.setTaxRate(taxRate);
            line.setQuantity(TaxMath.lineQuantity(lineDto.getQuantity()));
            line.setUnitPrice(TaxMath.unitPrice(lineDto.getUnitPrice()));

            BigDecimal lineBase = TaxMath.money(line.getQuantity().multiply(line.getUnitPrice()));
            subtotal = subtotal.add(lineBase);

            if (taxRate != null) {
                BigDecimal lineTax = TaxMath.percentOf(lineBase, taxRate.getRate());
                line.setTaxAmount(lineTax);

                if (isInterState) {
                    line.setIgstAmount(lineTax);
                } else {
                    BigDecimal cgst = TaxMath.cgstHalf(lineTax);
                    line.setCgstAmount(cgst);
                    line.setSgstAmount(lineTax.subtract(cgst));
                }

                taxTotal = taxTotal.add(lineTax);
                line.setLineTotal(lineBase.add(lineTax));
            } else {
                line.setTaxAmount(BigDecimal.ZERO);
                line.setLineTotal(lineBase);
            }

            invoice.addLine(line);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setTotalAmount(subtotal.add(taxTotal));

        if (initialStatus == SalesInvoiceStatus.ISSUED) {
            postIssuedInvoice(invoice);
        }

        SalesInvoice savedInvoice = salesInvoiceRepository.save(invoice);

        return salesInvoiceMapper.toDto(savedInvoice);
    }

    @Transactional
    @Audited(entity = "SalesInvoice", action = "ISSUE")
    public SalesInvoiceDto issueInvoice(UUID id) {
        SalesInvoice invoice = salesInvoiceRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        if (invoice.getStatus() != SalesInvoiceStatus.DRAFT) {
            throw new ConflictException("Only DRAFT invoices can be issued");
        }

        invoice.setStatus(SalesInvoiceStatus.ISSUED);
        postIssuedInvoice(invoice);

        return salesInvoiceMapper.toDto(salesInvoiceRepository.save(invoice));
    }

    /**
     * Side effects of an invoice becoming ISSUED — shared by create-as-issued and {@link #issueInvoice} so the
     * two paths can't drift: deduct stock for every line and add the total to the customer's receivable.
     */
    private void postIssuedInvoice(SalesInvoice invoice) {
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

        // The balance column is the owning organization's ledger; a branch invoicing a customer its parent shares
        // tracks what it is owed through its own invoices instead (CustomerBalanceService)
        Customer customer = invoice.getCustomer();
        if (sharedEntityResolver.isOwnedByCurrentOrg(customer.getOrganizationId())) {
            customer.setOutstandingBalance(customer.getOutstandingBalance().add(invoice.getTotalAmount()));
            customerRepository.save(customer);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> generateEInvoiceJson(UUID id) {
        SalesInvoice invoice = salesInvoiceRepository
                .findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));

        Organization org = organizationRepository
                .findById(invoice.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

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
        sellerDtls.put("Stcd", GstStates.codeOf(org.getState(), org.getGstin()).orElse(null));
        eInvoice.put("SellerDtls", sellerDtls);

        // Buyer Details
        Map<String, Object> buyerDtls = new HashMap<>();
        buyerDtls.put("Gstin", customer.getGstin() != null ? customer.getGstin() : "URP");
        buyerDtls.put("LglNm", customer.getName());
        buyerDtls.put("Addr1", customer.getBillingAddressLine1());
        buyerDtls.put("Loc", customer.getBillingCity());
        buyerDtls.put("Pin", customer.getBillingPincode());
        buyerDtls.put(
                "Stcd",
                GstStates.codeOf(customer.getBillingState(), customer.getGstin())
                        .orElse(null));
        eInvoice.put("BuyerDtls", buyerDtls);

        // Item List & HSN Summary
        List<SalesInvoiceLine> lines = invoice.getLines();
        List<Map<String, Object>> itemList = IntStream.range(0, lines.size())
                .mapToObj(i -> {
                    SalesInvoiceLine line = lines.get(i);
                    Map<String, Object> item = new HashMap<>();
                    item.put("SlNo", String.valueOf(i + 1));
                    item.put("PrdDesc", line.getProduct().getName());
                    item.put("IsServc", "N");
                    item.put("HsnCd", line.getProduct().getHsnSac());
                    item.put("Qty", line.getQuantity());
                    item.put("Unit", "NOS");
                    item.put("UnitPrice", line.getUnitPrice());
                    // The taxable value the line's tax was computed on (quantity × rate, in paise)
                    item.put("TotAmt", TaxMath.money(line.getQuantity().multiply(line.getUnitPrice())));
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

    @Transactional(readOnly = true)
    public String getNextInvoiceNumberPreview() {
        return sequenceGeneratorService.peekNextDocumentNumber(DocumentType.INVOICE);
    }
}
