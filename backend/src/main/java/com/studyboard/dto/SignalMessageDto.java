package com.studyboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebRTC signaling envelope relayed room-wide (or peer-targeted) over WebSocket:
 * type = OFFER | ANSWER | ICE_CANDIDATE | JOIN | LEAVE
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessageDto {
    private String type;
    private Long roomId;
    private Long fromUserId;
    private Long toUserId; // null = broadcast to room
    private String sdp;
    private String candidate;
}
