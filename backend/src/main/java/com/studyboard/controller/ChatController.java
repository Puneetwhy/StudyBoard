package com.studyboard.controller;

import com.studyboard.dto.ChatMessageDto;
import com.studyboard.service.ChatService;
import com.studyboard.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoint for fetching chat history (e.g. on room load).
 * Live message delivery happens over STOMP in ChatWebSocketController.
 */
@RestController
@RequestMapping("/api/rooms/{roomId}/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<ChatMessageDto>> history(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(roomId, userId);
        return ResponseEntity.ok(chatService.getHistory(roomId));
    }
}
