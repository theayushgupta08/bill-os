package com.billos.api.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductCategoryDto {

    private UUID id;
    private UUID parentId;
    private String name;
    private String description;
}
