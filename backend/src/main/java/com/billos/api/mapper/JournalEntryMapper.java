package com.billos.api.mapper;

import com.billos.api.dto.JournalEntryDto;
import com.billos.api.dto.JournalEntryLineDto;
import com.billos.api.entity.JournalEntry;
import com.billos.api.entity.JournalEntryLine;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface JournalEntryMapper {

    JournalEntryDto toDto(JournalEntry entity);

    @Mapping(target = "lines", ignore = true) // Handled in service
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    JournalEntry toEntity(JournalEntryDto dto);

    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "account.name", target = "accountName")
    JournalEntryLineDto lineToDto(JournalEntryLine line);

    @Mapping(target = "journalEntry", ignore = true)
    @Mapping(target = "account", ignore = true) // Handled in service
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    JournalEntryLine lineToEntity(JournalEntryLineDto dto);

    List<JournalEntryLineDto> linesToDtos(List<JournalEntryLine> lines);
}
