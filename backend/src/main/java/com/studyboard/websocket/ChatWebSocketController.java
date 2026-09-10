package com.studyboard.websocket;

import com.studyboard.dto.ChatMessageDto;
import com.studyboard.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * STOMP destinations:
 *   Client sends to:    /app/rooms/{roomId}/chat.send
 *   Server broadcasts:  /topic/rooms/{roomId}/chat
 */
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{roomId}/chat.send")
    public void sendMessage(@DestinationVariable Long roomId, ChatMessageDto message) {
        message.setRoomId(roomId);
        ChatMessageDto saved = chatService.saveMessage(message);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/chat", saved);
    }
}
