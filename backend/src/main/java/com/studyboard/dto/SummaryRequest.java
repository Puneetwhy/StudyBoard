package com.studyboard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SummaryRequest {
    @NotNull
    private Long roomId;
}
