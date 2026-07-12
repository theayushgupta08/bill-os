package com.billos.api.dto;

import java.util.UUID;
import lombok.Data;

@Data
public class ProductCategoryDto {
    private UUID id;
    private UUID parentId;
    private String name;
    private String description;
}
