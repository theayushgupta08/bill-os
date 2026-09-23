package com.billos.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.billos.api.dto.HsnSummaryDto;
import com.billos.api.entity.Product;
import com.billos.api.entity.SalesInvoice;
import com.billos.api.entity.SalesInvoiceLine;
import com.billos.api.entity.SalesInvoiceStatus;
import com.billos.api.entity.TaxRate;
import com.billos.api.repository.SalesInvoiceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GstReportingServiceTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @InjectMocks
    private GstReportingService gstReportingService;

    private static SalesInvoiceLine line(String hsn, String rate, String qty, String base) {
        Product product = new Product();
        product.setHsnSac(hsn);
        product.setName("Item " + hsn);
        product.setUnitOfMeasure("NOS");
        TaxRate taxRate = new TaxRate();
        taxRate.setRate(new BigDecimal(rate));
        BigDecimal tax = new BigDecimal(base).multiply(new BigDecimal(rate)).divide(new BigDecimal("100"));

        SalesInvoiceLine line = new SalesInvoiceLine();
        line.setProduct(product);
        line.setTaxRate(taxRate);
        line.setQuantity(new BigDecimal(qty));
        line.setTaxAmount(tax);
        line.setIgstAmount(tax);
        line.setLineTotal(new BigDecimal(base).add(tax));
        return line;
    }

    private static SalesInvoice invoice(SalesInvoiceStatus status, SalesInvoiceLine... lines) {
        SalesInvoice inv = new SalesInvoice();
        inv.setStatus(status);
        inv.setInvoiceDate(LocalDate.of(2026, 9, 1));
        for (SalesInvoiceLine l : lines) inv.addLine(l);
        return inv;
    }

    @Test
    void groupsIssuedLinesByHsnAndRate_andSkipsDrafts() {
        when(salesInvoiceRepository.findAll())
                .thenReturn(List.of(
                        invoice(
                                SalesInvoiceStatus.ISSUED,
                                line("8471", "18", "2", "1000"),
                                line("8471", "18", "1", "500")),
                        invoice(SalesInvoiceStatus.PAID, line("8471", "12", "1", "100")),
                        invoice(SalesInvoiceStatus.DRAFT, line("8471", "18", "50", "99999"))));

        List<HsnSummaryDto> rows = gstReportingService.getHsnSummary(null, null);

        assertThat(rows).hasSize(2); // 8471 @12% and 8471 @18%
        HsnSummaryDto at18 = rows.stream()
                .filter(r -> r.getTaxRate().compareTo(new BigDecimal("18")) == 0)
                .findFirst()
                .orElseThrow();
        assertThat(at18.getTotalQuantity()).isEqualByComparingTo("3");
        assertThat(at18.getTaxableValue()).isEqualByComparingTo("1500");
        assertThat(at18.getIgstAmount()).isEqualByComparingTo("270");
        assertThat(at18.getUqc()).isEqualTo("NOS");
    }

    @Test
    void reportsLinesWithoutHsnUnderUnspecified() {
        when(salesInvoiceRepository.findAll())
                .thenReturn(List.of(invoice(SalesInvoiceStatus.ISSUED, line(null, "5", "1", "100"))));

        assertThat(gstReportingService.getHsnSummary(null, null).get(0).getHsnSac())
                .isEqualTo(GstReportingService.UNSPECIFIED_HSN);
    }
}
