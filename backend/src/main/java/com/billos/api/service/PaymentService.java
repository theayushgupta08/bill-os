package com.billos.api.service;

import com.billos.api.dto.PaymentAllocationDto;
import com.billos.api.dto.PaymentDto;
import com.billos.api.entity.*;
import com.billos.api.mapper.PaymentMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final PurchaseBillRepository purchaseBillRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final PaymentMapper paymentMapper;
    private final SequenceGeneratorService sequenceGeneratorService;

    @Transactional(readOnly = true)
    public List<PaymentDto> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(paymentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentDto recordReceipt(PaymentDto dto) {
        return processPayment(dto, PaymentType.RECEIPT);
    }

    @Transactional
    public PaymentDto recordPayment(PaymentDto dto) {
        return processPayment(dto, PaymentType.PAYMENT);
    }

    private PaymentDto processPayment(PaymentDto dto, PaymentType type) {
        UUID orgId = UUID.fromString(TenantContext.getCurrentTenant());

        Payment payment = new Payment();
        payment.setOrganizationId(orgId);
        payment.setPaymentNumber(sequenceGeneratorService.getNextDocumentNumber(
                type == PaymentType.RECEIPT ? DocumentType.PAYMENT_RECEIPT : DocumentType.PAYMENT_VOUCHER));
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setPaymentType(type);
        payment.setReferenceNumber(dto.getReferenceNumber());
        payment.setAmount(dto.getAmount());
        payment.setNotes(dto.getNotes());

        BigDecimal totalAllocated = BigDecimal.ZERO;

        for (PaymentAllocationDto allocDto : dto.getAllocations()) {
            PaymentAllocation allocation = new PaymentAllocation();
            allocation.setAllocatedAmount(allocDto.getAllocatedAmount());
            
            if (type == PaymentType.RECEIPT && allocDto.getSalesInvoiceId() != null) {
                SalesInvoice invoice = salesInvoiceRepository.findById(allocDto.getSalesInvoiceId())
                        .orElseThrow(() -> new RuntimeException("Invoice not found"));
                allocation.setSalesInvoice(invoice);
                
                // Update Customer balance
                Customer customer = invoice.getCustomer();
                customer.setOutstandingBalance(customer.getOutstandingBalance().subtract(allocDto.getAllocatedAmount()));
                customerRepository.save(customer);

                // Ideally we'd sum all previous allocations, but for V1 simple mockup:
                // Assuming this single allocation clears the invoice or makes it partial
                if (allocDto.getAllocatedAmount().compareTo(invoice.getTotalAmount()) >= 0) {
                    invoice.setStatus(SalesInvoiceStatus.PAID);
                } else {
                    invoice.setStatus(SalesInvoiceStatus.PARTIAL);
                }
                salesInvoiceRepository.save(invoice);
                
            } else if (type == PaymentType.PAYMENT && allocDto.getPurchaseBillId() != null) {
                PurchaseBill bill = purchaseBillRepository.findById(allocDto.getPurchaseBillId())
                        .orElseThrow(() -> new RuntimeException("Bill not found"));
                allocation.setPurchaseBill(bill);
                
                // Update Supplier balance
                Supplier supplier = bill.getSupplier();
                supplier.setOutstandingBalance(supplier.getOutstandingBalance().subtract(allocDto.getAllocatedAmount()));
                supplierRepository.save(supplier);

                if (allocDto.getAllocatedAmount().compareTo(bill.getTotalAmount()) >= 0) {
                    bill.setStatus(PurchaseBillStatus.PAID);
                } else {
                    bill.setStatus(PurchaseBillStatus.PARTIAL);
                }
                purchaseBillRepository.save(bill);
            }

            totalAllocated = totalAllocated.add(allocDto.getAllocatedAmount());
            payment.addAllocation(allocation);
        }

        // Validate allocation total doesn't exceed payment amount
        if (totalAllocated.compareTo(payment.getAmount()) > 0) {
            throw new RuntimeException("Total allocated amount exceeds payment amount");
        }

        Payment saved = paymentRepository.save(payment);
        return paymentMapper.toDto(saved);
    }
}
