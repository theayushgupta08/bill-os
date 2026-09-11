package com.billos.api.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResultDto {
    @Builder.Default
    private int totalCount = 0;

    @Builder.Default
    private int insertedCount = 0;

    @Builder.Default
    private int skippedCount = 0;

    @Builder.Default
    private List<BulkImportErrorDto> errors = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkImportErrorDto {
        private int row;
        private String identifier;
        private String reason;
    }
}
