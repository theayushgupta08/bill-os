package com.billos.api.service;

import com.billos.api.audit.Audited;
import com.billos.api.dto.QuotationDto;
import com.billos.api.dto.QuotationLineDto;
import com.billos.api.entity.*;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.QuotationMapper;
import com.billos.api.repository.QuotationRepository;
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
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final SharedEntityResolver sharedEntityResolver;
    private final TaxRateRepository taxRateRepository;
    private final QuotationMapper quotationMapper;
    private final SequenceGeneratorService sequenceGeneratorService;

    @Transactional(readOnly = true)
    public List<QuotationDto> getAllQuotations() {
        return quotationRepository.findAll().stream()
                .map(quotationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuotationDto getQuotationById(UUID id) {
        return quotationRepository
                .findById(id)
                .map(quotationMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Quotation not found"));
    }

    @Transactional
    @Audited(entity = "Quotation", action = "CREATE")
    public QuotationDto createQuotation(QuotationDto dto) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Customer customer = sharedEntityResolver.accessibleCustomer(dto.getCustomerId());

        Quotation quotation = new Quotation();
        quotation.setOrganizationId(orgId);
        quotation.setCustomer(customer);

        // Use SequenceGenerator for number
        quotation.setQuoteNumber(sequenceGeneratorService.getNextDocumentNumber(DocumentType.QUOTATION));
        quotation.setQuoteDate(dto.getQuoteDate());
        quotation.setExpiryDate(dto.getExpiryDate());
        quotation.setStatus(QuotationStatus.DRAFT);
        quotation.setNotes(dto.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        for (QuotationLineDto lineDto : dto.getLines()) {
            Product product = sharedEntityResolver.accessibleProduct(lineDto.getProductId());

            TaxRate taxRate = null;
            if (lineDto.getTaxRateId() != null) {
                taxRate = taxRateRepository
                        .findById(lineDto.getTaxRateId())
                        .orElseThrow(() -> new ResourceNotFoundException("Tax Rate not found"));
            }

            QuotationLine line = new QuotationLine();
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

            quotation.addLine(line);
        }

        quotation.setSubtotal(subtotal);
        quotation.setTaxTotal(taxTotal);
        quotation.setTotalAmount(subtotal.add(taxTotal));

        Quotation saved = quotationRepository.save(quotation);
        return quotationMapper.toDto(saved);
    }
}
