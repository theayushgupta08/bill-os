package com.billos.api.mapper;

import com.billos.api.dto.AccountDto;
import com.billos.api.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface AccountMapper {

    @Mapping(source = "parent.id", target = "parentId")
    AccountDto toDto(Account account);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    Account toEntity(AccountDto dto);

    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    void updateEntityFromDto(AccountDto dto, @MappingTarget Account entity);
}
