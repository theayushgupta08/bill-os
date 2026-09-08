package com.billos.api.dto;

import lombok.Data;

@Data
public class BankDetailsDto {
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String branchName;
    private String bankAddress;
}
