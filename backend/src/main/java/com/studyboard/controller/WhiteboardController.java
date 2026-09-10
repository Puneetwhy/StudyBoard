package com.studyboard.controller;

import com.studyboard.service.RoomService;
import com.studyboard.service.WhiteboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoint to fetch the last persisted whiteboard snapshot
 * (used to restore board state for a user joining/reloading).
 * Live drawing sync happens over STOMP in WhiteboardWebSocketController.
 */
@RestController
@RequestMapping("/api/rooms/{roomId}/whiteboard")
@RequiredArgsConstructor
public class WhiteboardController {

    private final WhiteboardService whiteboardService;
    private final RoomService roomService;

    @GetMapping("/snapshot")
    public ResponseEntity<String> getSnapshot(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(roomId, userId);
        return ResponseEntity.ok(whiteboardService.getSnapshot(roomId));
    }
}
