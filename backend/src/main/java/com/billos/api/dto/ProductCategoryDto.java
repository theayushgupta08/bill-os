package com.billos.api.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ProductCategoryDto {
    private UUID id;
    private UUID parentId;
    private String name;
    private String description;
}
