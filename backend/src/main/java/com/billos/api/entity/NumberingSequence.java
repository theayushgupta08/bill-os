package com.billos.api.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "numbering_sequences")
@Getter
@Setter
public class NumberingSequence extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @TenantId
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(nullable = false)
    private String prefix;

    @Column(name = "next_number", nullable = false)
    private Long nextNumber = 1L;

    @Column(name = "padding_length", nullable = false)
    private Integer paddingLength = 4;
}
