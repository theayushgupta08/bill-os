package com.billos.api.mapper;

import com.billos.api.dto.CustomerDto;
import com.billos.api.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);

    Customer toEntity(CustomerDto customerDto);

    @org.mapstruct.Mapping(target = "outstandingBalance", ignore = true)
    void updateEntityFromDto(CustomerDto dto, @MappingTarget Customer entity);
}
