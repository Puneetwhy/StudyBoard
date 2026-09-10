package com.studyboard.websocket;

import com.studyboard.dto.WhiteboardEventDto;
import com.studyboard.service.WhiteboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * STOMP destinations:
 *   Client sends to:    /app/rooms/{roomId}/board.event   (incremental draw/erase/cursor events)
 *   Server broadcasts:  /topic/rooms/{roomId}/board
 *
 *   Client sends to:    /app/rooms/{roomId}/board.sync     (full-state checkpoint, e.g. every N strokes)
 *   Server persists it so late joiners can restore via GET /api/rooms/{roomId}/whiteboard/snapshot
 */
@Controller
@RequiredArgsConstructor
public class WhiteboardWebSocketController {

    private final WhiteboardService whiteboardService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{roomId}/board.event")
    public void broadcastEvent(@DestinationVariable Long roomId, WhiteboardEventDto event) {
        event.setRoomId(roomId);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/board", event);
    }

    @MessageMapping("/rooms/{roomId}/board.sync")
    public void syncFullState(@DestinationVariable Long roomId, WhiteboardEventDto event) {
        // event.payload carries the full serialized board JSON here
        whiteboardService.saveSnapshot(roomId, event.getPayload());
    }
}
