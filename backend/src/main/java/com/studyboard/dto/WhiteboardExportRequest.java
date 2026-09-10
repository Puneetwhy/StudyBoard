package com.studyboard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class WhiteboardExportRequest {
    @NotNull
    private Long roomId;

    /**
     * Base64-encoded PNG snapshot of the whiteboard canvas, produced by the
     * frontend (e.g. canvas.toDataURL()). Embedded into the exported PDF.
     */
    @NotNull
    private String imageBase64;
}
