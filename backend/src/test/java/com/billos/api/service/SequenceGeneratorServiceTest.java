package com.billos.api.service;

import com.billos.api.entity.DocumentType;
import com.billos.api.entity.NumberingSequence;
import com.billos.api.repository.NumberingSequenceRepository;
import com.billos.api.tenant.TenantContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class SequenceGeneratorServiceTest {

    @Mock
    private NumberingSequenceRepository numberingSequenceRepository;

    @InjectMocks
    private SequenceGeneratorService sequenceGeneratorService;

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(UUID.randomUUID().toString());
    }

    @Test
    void getNextDocumentNumber_existingSequence() {
        NumberingSequence seq = new NumberingSequence();
        seq.setPrefix("INV-");
        seq.setNextNumber(15L);
        seq.setPaddingLength(4);

        when(numberingSequenceRepository.findByOrganizationIdAndDocumentType(any(UUID.class), eq(DocumentType.INVOICE)))
                .thenReturn(Optional.of(seq));
        when(numberingSequenceRepository.save(any(NumberingSequence.class))).thenReturn(seq);

        String result = sequenceGeneratorService.getNextDocumentNumber(DocumentType.INVOICE);

        assertEquals("INV-0015", result);
        assertEquals(16L, seq.getNextNumber());
    }
}
