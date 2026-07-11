package com.billos.api.service;

import com.billos.api.entity.DocumentType;
import com.billos.api.entity.NumberingSequence;
import com.billos.api.repository.NumberingSequenceRepository;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SequenceGeneratorService {

    private final NumberingSequenceRepository numberingSequenceRepository;

    @Transactional
    public String getNextDocumentNumber(DocumentType documentType) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());
        
        NumberingSequence sequence = numberingSequenceRepository
                .findByOrganizationIdAndDocumentType(orgId, documentType)
                .orElseGet(() -> createDefaultSequence(orgId, documentType));
                
        Long currentNumber = sequence.getNextNumber();
        sequence.setNextNumber(currentNumber + 1);
        numberingSequenceRepository.save(sequence);
        
        return String.format("%s%0" + sequence.getPaddingLength() + "d", sequence.getPrefix(), currentNumber);
    }

    private NumberingSequence createDefaultSequence(UUID orgId, DocumentType type) {
        NumberingSequence seq = new NumberingSequence();
        seq.setOrganizationId(orgId);
        seq.setDocumentType(type);
        seq.setNextNumber(1L);
        seq.setPaddingLength(4);
        
        switch (type) {
            case QUOTATION: seq.setPrefix("QT-"); break;
            case SALES_ORDER: seq.setPrefix("SO-"); break;
            case INVOICE: seq.setPrefix("INV-"); break;
            case PURCHASE_ORDER: seq.setPrefix("PO-"); break;
            case PURCHASE_BILL: seq.setPrefix("PB-"); break;
            case JOURNAL_ENTRY: seq.setPrefix("JE-"); break;
            default: seq.setPrefix("DOC-"); break;
        }
        
        return numberingSequenceRepository.save(seq);
    }
}
