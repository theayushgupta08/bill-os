package com.billos.api.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

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
