package com.studyboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotesExportRequest {
    @NotNull
    private Long roomId;

    @NotBlank
    private String title;

    @NotBlank
    private String content;
}
