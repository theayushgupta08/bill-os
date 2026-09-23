package com.billos.api.service;

import com.billos.api.dto.PaymentAllocationDto;
import com.billos.api.dto.PaymentDto;
import com.billos.api.entity.*;
import com.billos.api.exception.BadRequestException;
import com.billos.api.exception.ConflictException;
import com.billos.api.exception.ResourceNotFoundException;
import com.billos.api.mapper.PaymentMapper;
import com.billos.api.repository.*;
import com.billos.api.tenant.TenantContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
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
        return paymentRepository.findAll().stream().map(paymentMapper::toDto).collect(Collectors.toList());
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

        if (dto.getAmount() == null || dto.getAmount().signum() <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        // Validate before touching any document so a rejected payment leaves no partial side effects
        BigDecimal totalAllocated = BigDecimal.ZERO;
        for (PaymentAllocationDto allocDto : dto.getAllocations()) {
            if (allocDto.getAllocatedAmount() == null
                    || allocDto.getAllocatedAmount().signum() <= 0) {
                throw new BadRequestException("Allocated amount must be greater than zero");
            }
            totalAllocated = totalAllocated.add(allocDto.getAllocatedAmount());
        }
        if (totalAllocated.compareTo(dto.getAmount()) > 0) {
            throw new BadRequestException("Total allocated amount exceeds payment amount");
        }

        Payment payment = new Payment();
        payment.setOrganizationId(orgId);
        payment.setPaymentDate(dto.getPaymentDate());
        payment.setPaymentType(type);
        payment.setReferenceNumber(dto.getReferenceNumber());
        payment.setAmount(dto.getAmount());
        payment.setNotes(dto.getNotes());

        for (PaymentAllocationDto allocDto : dto.getAllocations()) {
            PaymentAllocation allocation = new PaymentAllocation();
            BigDecimal amount = allocDto.getAllocatedAmount();
            allocation.setAllocatedAmount(amount);

            if (type == PaymentType.RECEIPT && allocDto.getSalesInvoiceId() != null) {
                SalesInvoice invoice = salesInvoiceRepository
                        .findById(allocDto.getSalesInvoiceId())
                        .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
                if (invoice.getStatus() != SalesInvoiceStatus.ISSUED
                        && invoice.getStatus() != SalesInvoiceStatus.PARTIAL) {
                    throw new ConflictException("Cannot record a payment against a " + invoice.getStatus()
                            + " invoice (" + invoice.getInvoiceNumber() + ")");
                }

                BigDecimal newPaid = invoice.getAmountPaid().add(amount);
                if (newPaid.compareTo(invoice.getTotalAmount()) > 0) {
                    throw new BadRequestException("Payment of " + amount + " exceeds the balance due of "
                            + invoice.getTotalAmount().subtract(invoice.getAmountPaid()) + " on invoice "
                            + invoice.getInvoiceNumber());
                }
                invoice.setAmountPaid(newPaid);
                invoice.setStatus(
                        newPaid.compareTo(invoice.getTotalAmount()) >= 0
                                ? SalesInvoiceStatus.PAID
                                : SalesInvoiceStatus.PARTIAL);
                allocation.setSalesInvoice(invoice);
                salesInvoiceRepository.save(invoice);

                Customer customer = invoice.getCustomer();
                customer.setOutstandingBalance(customer.getOutstandingBalance().subtract(amount));
                customerRepository.save(customer);

            } else if (type == PaymentType.PAYMENT && allocDto.getPurchaseBillId() != null) {
                PurchaseBill bill = purchaseBillRepository
                        .findById(allocDto.getPurchaseBillId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));
                if (bill.getStatus() != PurchaseBillStatus.UNPAID && bill.getStatus() != PurchaseBillStatus.PARTIAL) {
                    throw new ConflictException("Cannot record a payment against a " + bill.getStatus() + " bill ("
                            + bill.getBillNumber() + ")");
                }

                BigDecimal newPaid = bill.getAmountPaid().add(amount);
                if (newPaid.compareTo(bill.getTotalAmount()) > 0) {
                    throw new BadRequestException("Payment of " + amount + " exceeds the balance due of "
                            + bill.getTotalAmount().subtract(bill.getAmountPaid()) + " on bill "
                            + bill.getBillNumber());
                }
                bill.setAmountPaid(newPaid);
                bill.setStatus(
                        newPaid.compareTo(bill.getTotalAmount()) >= 0
                                ? PurchaseBillStatus.PAID
                                : PurchaseBillStatus.PARTIAL);
                allocation.setPurchaseBill(bill);
                purchaseBillRepository.save(bill);

                Supplier supplier = bill.getSupplier();
                supplier.setOutstandingBalance(supplier.getOutstandingBalance().subtract(amount));
                supplierRepository.save(supplier);
            } else {
                throw new BadRequestException(
                        type == PaymentType.RECEIPT
                                ? "Receipt allocations must reference a sales invoice"
                                : "Payment allocations must reference a purchase bill");
            }

            payment.addAllocation(allocation);
        }

        // Number the payment only once it is known to be valid, so rejected payments don't burn numbers
        payment.setPaymentNumber(sequenceGeneratorService.getNextDocumentNumber(
                type == PaymentType.RECEIPT ? DocumentType.PAYMENT_RECEIPT : DocumentType.PAYMENT_VOUCHER));

        Payment saved = paymentRepository.save(payment);
        return paymentMapper.toDto(saved);
    }
}
