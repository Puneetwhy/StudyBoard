package com.studyboard.controller;

import com.studyboard.dto.*;
import com.studyboard.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest request,
                                                     Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(roomService.createRoom(request.getName(), userId));
    }

    @PostMapping("/join")
    public ResponseEntity<RoomResponse> joinRoom(@Valid @RequestBody RoomJoinRequest request,
                                                   Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(roomService.joinRoom(request.getJoinCode(), userId));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<RoomSummaryResponse>> myRooms(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(roomService.listRoomsForUser(userId));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(roomId, userId);
        return ResponseEntity.ok(roomService.getRoom(roomId, userId));
    }

    @PutMapping("/{roomId}")
    public ResponseEntity<RoomResponse> renameRoom(@PathVariable Long roomId,
                                                     @Valid @RequestBody RoomUpdateRequest request,
                                                     Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(roomService.renameRoom(roomId, userId, request.getName()));
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.deleteRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }
}
