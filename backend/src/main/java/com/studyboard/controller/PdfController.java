package com.studyboard.controller;

import com.studyboard.dto.ExportedFileResponse;
import com.studyboard.dto.NotesExportRequest;
import com.studyboard.dto.WhiteboardExportRequest;
import com.studyboard.service.ExportService;
import com.studyboard.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class PdfController {

    private final ExportService exportService;
    private final RoomService roomService;

    @PostMapping("/notes")
    public ResponseEntity<ExportedFileResponse> exportNotes(@Valid @RequestBody NotesExportRequest request,
                                                            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(request.getRoomId(), userId);
        return ResponseEntity.ok(exportService.exportNotes(request.getRoomId(), request.getTitle(), request.getContent()));
    }

    @PostMapping("/whiteboard")
    public ResponseEntity<ExportedFileResponse> exportWhiteboard(@Valid @RequestBody WhiteboardExportRequest request,
                                                                 Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(request.getRoomId(), userId);
        return ResponseEntity.ok(exportService.exportWhiteboard(request.getRoomId(), request.getImageBase64()));
    }

    /** All exported documents (notes + whiteboard PDFs) for a room — used by the session history page. */
    @GetMapping("/{roomId}")
    public ResponseEntity<List<ExportedFileResponse>> listExports(@PathVariable Long roomId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        roomService.assertMember(roomId, userId);
        return ResponseEntity.ok(exportService.listExports(roomId));
    }
}