package com.studyboard.controller;

import com.studyboard.dto.SummaryRequest;
import com.studyboard.dto.SummaryResponse;
import com.studyboard.service.RoomService;
import com.studyboard.service.SummaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/summary")
@RequiredArgsConstructor
public class SummaryController {

    private final SummaryService summaryService;
    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<SummaryResponse> generate(@Valid @RequestBody SummaryRequest request, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(request.getRoomId(), userId);
        return ResponseEntity.ok(summaryService.summarizeRoom(request.getRoomId()));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<List<SummaryResponse>> list(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(roomId, userId);
        return ResponseEntity.ok(summaryService.getSummaries(roomId));
    }
}
