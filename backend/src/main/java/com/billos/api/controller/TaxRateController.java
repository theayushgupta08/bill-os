package com.billos.api.controller;

import com.billos.api.dto.TaxRateDto;
import com.billos.api.service.TaxRateService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tax-rates")
@RequiredArgsConstructor
public class TaxRateController {

    private final TaxRateService taxRateService;

    @GetMapping
    public ResponseEntity<List<TaxRateDto>> getAllTaxRates() {
        return ResponseEntity.ok(taxRateService.getAllTaxRates());
    }

    @PostMapping
    public ResponseEntity<TaxRateDto> createTaxRate(@RequestBody TaxRateDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taxRateService.createTaxRate(dto));
    }
}
