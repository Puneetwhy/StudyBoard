package com.studyboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single incremental whiteboard event broadcast over WebSocket
 * (e.g. "draw", "erase", "clear", "cursor"). The payload carries the
 * shape/stroke data as an opaque JSON string produced by the frontend
 * canvas library, so the backend never needs to understand its shape.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhiteboardEventDto {
    private Long roomId;
    private String type;
    private String payload;
    private Long senderId;
}
