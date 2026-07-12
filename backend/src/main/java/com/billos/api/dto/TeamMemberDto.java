package com.billos.api.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String status; // ACTIVE or INVITED
}
