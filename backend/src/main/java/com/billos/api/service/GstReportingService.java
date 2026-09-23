package com.billos.api.service;

import com.billos.api.dto.HsnSummaryDto;
import com.billos.api.entity.Product;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceLine;
import com.billos.api.repository.SalesInvoiceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GstReportingService {

    static final String UNSPECIFIED_HSN = "UNSPECIFIED";

    private final SalesInvoiceRepository salesInvoiceRepository;

    /**
     * HSN-wise summary of outward supplies (GSTR-1 table 12): issued invoice lines grouped by HSN/SAC code and tax
     * rate, as the return requires. Drafts and voided invoices are excluded, like every other GST report.
     */
    @Transactional(readOnly = true)
    public List<HsnSummaryDto> getHsnSummary(LocalDate startDate, LocalDate endDate) {
        Map<String, HsnSummaryDto> rows = new LinkedHashMap<>();

        for (SalesInvoice invoice : salesInvoiceRepository.findAll()) {
            if (!ReportService.isReportableInvoice(invoice)
                    || (startDate != null && invoice.getInvoiceDate().isBefore(startDate))
                    || (endDate != null && invoice.getInvoiceDate().isAfter(endDate))) {
                continue;
            }
            for (SalesInvoiceLine line : invoice.getLines()) {
                Product product = line.getProduct();
                String hsn = product != null
                                && product.getHsnSac() != null
                                && !product.getHsnSac().isBlank()
                        ? product.getHsnSac().trim()
                        : UNSPECIFIED_HSN;
                BigDecimal rate = line.getTaxRate() != null ? line.getTaxRate().getRate() : BigDecimal.ZERO;

                HsnSummaryDto row = rows.computeIfAbsent(
                        hsn + "|" + rate.stripTrailingZeros().toPlainString(), k -> {
                            HsnSummaryDto r = new HsnSummaryDto();
                            r.setHsnSac(hsn);
                            r.setTaxRate(rate);
                            r.setDescription(product != null ? product.getName() : null);
                            r.setUqc(product != null ? product.getUnitOfMeasure() : null);
                            return r;
                        });

                BigDecimal tax = orZero(line.getTaxAmount());
                BigDecimal lineTotal = orZero(line.getLineTotal());
                row.setTotalQuantity(row.getTotalQuantity().add(orZero(line.getQuantity())));
                row.setTaxableValue(row.getTaxableValue().add(lineTotal.subtract(tax)));
                row.setCgstAmount(row.getCgstAmount().add(orZero(line.getCgstAmount())));
                row.setSgstAmount(row.getSgstAmount().add(orZero(line.getSgstAmount())));
                row.setIgstAmount(row.getIgstAmount().add(orZero(line.getIgstAmount())));
                row.setTotalTax(row.getTotalTax().add(tax));
                row.setTotalValue(row.getTotalValue().add(lineTotal));
            }
        }

        List<HsnSummaryDto> result = new ArrayList<>(rows.values());
        result.sort(Comparator.comparing(HsnSummaryDto::getHsnSac).thenComparing(HsnSummaryDto::getTaxRate));
        return result;
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
