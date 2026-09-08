package com.billos.api.dto;

import com.billos.api.entity.Organization;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationTreeDto {
    private Organization primaryOrganization;
    private List<Organization> branches;
}
