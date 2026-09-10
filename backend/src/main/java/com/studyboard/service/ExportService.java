package com.studyboard.service;

import com.studyboard.dto.ExportedFileResponse;
import com.studyboard.entity.ExportedFile;
import com.studyboard.repository.ExportedFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final PdfService pdfService;
    private final CloudinaryService cloudinaryService;
    private final ExportedFileRepository exportedFileRepository;

    public ExportedFileResponse exportNotes(Long roomId, String title, String content) {
        File pdf = pdfService.generateNotesPdf(title, content);
        String url = cloudinaryService.uploadPdf(pdf, "notes-room" + roomId);
        return save(roomId, "NOTES", title + ".pdf", url);
    }

    public ExportedFileResponse exportWhiteboard(Long roomId, String imageBase64) {
        File pdf = pdfService.generateWhiteboardPdf(imageBase64);
        String url = cloudinaryService.uploadPdf(pdf, "whiteboard-room" + roomId);
        return save(roomId, "WHITEBOARD", "whiteboard-export.pdf", url);
    }

    /** All exported documents for a room, newest first — shown on the room history page. */
    public List<ExportedFileResponse> listExports(Long roomId) {
        return exportedFileRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(f -> ExportedFileResponse.builder()
                        .id(f.getId())
                        .roomId(f.getRoomId())
                        .type(f.getType())
                        .fileName(f.getFileName())
                        .url(f.getUrl())
                        .createdAt(f.getCreatedAt())
                        .build())
                .toList();
    }

    private ExportedFileResponse save(Long roomId, String type, String fileName, String url) {
        ExportedFile saved = exportedFileRepository.save(ExportedFile.builder()
                .roomId(roomId)
                .type(type)
                .fileName(fileName)
                .url(url)
                .build());

        return ExportedFileResponse.builder()
                .id(saved.getId())
                .roomId(saved.getRoomId())
                .type(saved.getType())
                .fileName(saved.getFileName())
                .url(saved.getUrl())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}