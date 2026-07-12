package com.billos.api.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class JournalEntryDto {
    private UUID id;
    private LocalDate entryDate;
    private String referenceNumber;
    private String description;
    private String status;
    private List<JournalEntryLineDto> lines = new ArrayList<>();
}
