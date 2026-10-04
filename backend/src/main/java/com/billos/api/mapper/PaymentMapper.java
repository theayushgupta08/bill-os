package com.billos.api.mapper;

import com.billos.api.dto.PaymentAllocationDto;
import com.billos.api.dto.PaymentDto;
import com.billos.api.entity.Payment;
import com.billos.api.entity.PaymentAllocation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentMapper {

    PaymentDto toDto(Payment payment);

    @Mapping(source = "salesInvoice.id", target = "salesInvoiceId")
    @Mapping(source = "salesInvoice.invoiceNumber", target = "invoiceNumber")
    @Mapping(source = "purchaseBill.id", target = "purchaseBillId")
    @Mapping(source = "purchaseBill.billNumber", target = "billNumber")
    PaymentAllocationDto toDto(PaymentAllocation allocation);

    @Mapping(target = "allocations", ignore = true)
    @Mapping(target = "id", ignore = true) // never taken from the request: a client id would merge over an existing row
    Payment toEntity(PaymentDto dto);
}
