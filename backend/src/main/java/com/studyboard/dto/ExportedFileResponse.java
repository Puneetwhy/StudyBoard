package com.studyboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportedFileResponse {
    private Long id;
    private Long roomId;
    private String type;
    private String fileName;
    private String url;
    private Instant createdAt;
}
