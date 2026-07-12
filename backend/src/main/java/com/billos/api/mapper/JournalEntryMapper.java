package com.billos.api.mapper;

import com.billos.api.dto.JournalEntryDto;
import com.billos.api.dto.JournalEntryLineDto;
import com.billos.api.entity.JournalEntry;
import com.billos.api.entity.JournalEntryLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface JournalEntryMapper {

    JournalEntryDto toDto(JournalEntry entity);

    @Mapping(target = "lines", ignore = true) // Handled in service
    JournalEntry toEntity(JournalEntryDto dto);

    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "account.name", target = "accountName")
    JournalEntryLineDto lineToDto(JournalEntryLine line);

    @Mapping(target = "journalEntry", ignore = true)
    @Mapping(target = "account", ignore = true) // Handled in service
    JournalEntryLine lineToEntity(JournalEntryLineDto dto);
    
    List<JournalEntryLineDto> linesToDtos(List<JournalEntryLine> lines);
}
