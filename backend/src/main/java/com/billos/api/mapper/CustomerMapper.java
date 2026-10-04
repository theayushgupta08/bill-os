package com.billos.api.mapper;

import com.billos.api.dto.CustomerDto;
import com.billos.api.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);

    @org.mapstruct.Mapping(target = "outstandingBalance", defaultExpression = "java(java.math.BigDecimal.ZERO)")
    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    @org.mapstruct.Mapping(target = "organizationId", ignore = true)
    @org.mapstruct.Mapping(target = "originatingOrgId", ignore = true)
    Customer toEntity(CustomerDto customerDto);

    @org.mapstruct.Mapping(target = "outstandingBalance", ignore = true)
    @org.mapstruct.Mapping(
            target = "id",
            ignore = true) // never taken from the request: a client id would merge over an existing row
    @org.mapstruct.Mapping(target = "organizationId", ignore = true)
    @org.mapstruct.Mapping(target = "originatingOrgId", ignore = true)
    void updateEntityFromDto(CustomerDto dto, @MappingTarget Customer entity);
}
