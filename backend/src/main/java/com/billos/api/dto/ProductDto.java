package com.billos.api.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductDto {
    private UUID id;
    private UUID categoryId;
    private String name;
    private String description;
    private String sku;
    private String hsnSac;
    private BigDecimal basePrice;
    private BigDecimal taxRate;
    private String unitOfMeasure;
}
