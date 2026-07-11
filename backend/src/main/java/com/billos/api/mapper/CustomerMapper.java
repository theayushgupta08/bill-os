package com.billos.api.mapper;

import com.billos.api.dto.CustomerDto;
import com.billos.api.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);
    Customer toEntity(CustomerDto customerDto);
    void updateEntityFromDto(CustomerDto dto, @MappingTarget Customer entity);
}
