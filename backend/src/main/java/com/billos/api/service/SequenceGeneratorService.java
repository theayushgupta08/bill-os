package com.billos.api.service;

import com.billos.api.entity.DocumentType;
import com.billos.api.entity.NumberingSequence;
import com.billos.api.entity.OrganizationSettings;
import com.billos.api.repository.NumberingSequenceRepository;
import com.billos.api.repository.OrganizationSettingsRepository;
import com.billos.api.tenant.TenantContext;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SequenceGeneratorService {

    private final NumberingSequenceRepository numberingSequenceRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;

    @Transactional
    public String getNextDocumentNumber(DocumentType documentType) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        // Row lock: concurrent callers wait here instead of reading the same next number
        NumberingSequence sequence = numberingSequenceRepository
                .findForUpdate(orgId, documentType)
                .orElseGet(() -> createDefaultSequence(orgId, documentType));

        syncInvoicePrefix(orgId, documentType, sequence);

        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);
        numberingSequenceRepository.save(sequence);

        return String.format("%s%0" + sequence.getPaddingLength() + "d", sequence.getPrefix(), currentNumber);
    }

    @Transactional(readOnly = true)
    public String peekNextDocumentNumber(DocumentType documentType) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        NumberingSequence sequence = numberingSequenceRepository
                .findByOrganizationIdAndDocumentType(orgId, documentType)
                .orElseGet(() -> createDefaultSequence(orgId, documentType));

        syncInvoicePrefix(orgId, documentType, sequence);

        Long currentNumber = sequence.getNextNumber();
        return String.format("%s%0" + sequence.getPaddingLength() + "d", sequence.getPrefix(), currentNumber);
    }

    private void syncInvoicePrefix(UUID orgId, DocumentType documentType, NumberingSequence sequence) {
        if (documentType == DocumentType.INVOICE && organizationSettingsRepository != null) {
            organizationSettingsRepository
                    .findByOrganizationId(orgId)
                    .map(OrganizationSettings::getInvoicePrefix)
                    .filter(p -> p != null && !p.trim().isEmpty())
                    .ifPresent(sequence::setPrefix);
        }
    }

    private NumberingSequence createDefaultSequence(UUID orgId, DocumentType type) {
        NumberingSequence seq = new NumberingSequence();
        seq.setOrganizationId(orgId);
        seq.setDocumentType(type);
        seq.setNextNumber(1L);
        seq.setPaddingLength(4);

        switch (type) {
            case QUOTATION:
                seq.setPrefix("QT-");
                break;
            case SALES_ORDER:
                seq.setPrefix("SO-");
                break;
            case INVOICE:
                String prefix = "INV-";
                if (organizationSettingsRepository != null) {
                    prefix = organizationSettingsRepository
                            .findByOrganizationId(orgId)
                            .map(OrganizationSettings::getInvoicePrefix)
                            .filter(p -> p != null && !p.trim().isEmpty())
                            .orElse("INV-");
                }
                seq.setPrefix(prefix);
                break;
            case PURCHASE_ORDER:
                seq.setPrefix("PO-");
                break;
            case PURCHASE_BILL:
                seq.setPrefix("PB-");
                break;
            case JOURNAL_ENTRY:
                seq.setPrefix("JE-");
                break;
            default:
                seq.setPrefix("DOC-");
                break;
        }

        return numberingSequenceRepository.save(seq);
    }
}
