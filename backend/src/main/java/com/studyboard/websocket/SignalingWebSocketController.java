package com.studyboard.websocket;

import com.studyboard.dto.SignalMessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Lightweight WebRTC signaling relay over the same WebSocket connection
 * used for chat/whiteboard. Only handles OFFER/ANSWER/ICE_CANDIDATE/JOIN/LEAVE
 * relay — actual media flows peer-to-peer via WebRTC using the public
 * Google STUN server (see frontend config). No TURN server is run on Render,
 * since free-tier web services don't support persistent UDP well; most
 * peers on typical networks will connect directly or via STUN-assisted NAT
 * traversal. For restrictive NATs, add a third-party TURN provider later.
 *
 * STOMP destinations:
 *   Client sends to:    /app/rooms/{roomId}/signal
 *   Server broadcasts:  /topic/rooms/{roomId}/signal   (all peers filter by toUserId client-side,
 *                                                        or omit toUserId to broadcast e.g. JOIN/LEAVE)
 */
@Controller
@RequiredArgsConstructor
public class SignalingWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{roomId}/signal")
    public void relaySignal(@DestinationVariable Long roomId, SignalMessageDto signal) {
        signal.setRoomId(roomId);
        // Broadcast to the room topic; each connected peer's frontend ignores
        // messages not addressed to it (toUserId != own id) except for JOIN/LEAVE.
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/signal", signal);
    }
}
