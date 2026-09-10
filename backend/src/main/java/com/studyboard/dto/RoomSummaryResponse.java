package com.studyboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Lightweight room card for the "My sessions" history page —
 * includes whether the current user created it (controls delete/rename access).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSummaryResponse {
    private Long id;
    private String name;
    private String joinCode;
    private Long createdBy;
    private boolean owner;
    private Instant createdAt;
    private Instant lastJoinedAt;
}
