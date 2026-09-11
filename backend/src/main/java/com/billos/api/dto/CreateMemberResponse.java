package com.billos.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateMemberResponse {
    private String userId;
    private String email;
    private String generatedPassword;
    private String firstName;
    private String lastName;
    private String role;
}
