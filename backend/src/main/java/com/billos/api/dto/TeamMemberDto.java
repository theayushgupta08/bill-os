package com.billos.api.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private String status; // ACTIVE or INVITED
    private String inviteToken;
    private UUID invitationId;

    public TeamMemberDto(UUID userId, String email, String firstName, String lastName, String role, String status) {
        this(userId, email, firstName, lastName, role, status, null, null);
    }

    public TeamMemberDto(
            UUID userId,
            String email,
            String firstName,
            String lastName,
            String role,
            String status,
            String inviteToken) {
        this(userId, email, firstName, lastName, role, status, inviteToken, null);
    }
}
