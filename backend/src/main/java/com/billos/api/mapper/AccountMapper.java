package com.billos.api.mapper;

import com.billos.api.dto.AccountDto;
import com.billos.api.entity.Account;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AccountMapper {

    @Mapping(source = "parent.id", target = "parentId")
    AccountDto toDto(Account account);

    @Mapping(target = "parent", ignore = true)
    Account toEntity(AccountDto dto);

    @Mapping(target = "parent", ignore = true)
    void updateEntityFromDto(AccountDto dto, @MappingTarget Account entity);
}
