package com.billos.api.dto;

import com.billos.api.entity.AccountType;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class AccountDto {
    private UUID id;
    private String accountCode;
    private String name;
    private String description;
    private AccountType type;
    private UUID parentId;
    private BigDecimal balance;
    /**
     * Lombok names the accessors isActive()/setActive(), which Jackson would expose as "active" — so the
     * "isActive" the frontend sends was silently ignored. Pin the JSON name on both accessors.
     */
    @Getter(onMethod_ = @JsonProperty("isActive"))
    @Setter(onMethod_ = @JsonProperty("isActive"))
    private boolean isActive = true;
}
