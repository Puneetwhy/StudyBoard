package com.studyboard.service;

import com.studyboard.entity.WhiteboardSnapshot;
import com.studyboard.repository.WhiteboardSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class WhiteboardService {

    private final WhiteboardSnapshotRepository snapshotRepository;

    @Transactional
    public void saveSnapshot(Long roomId, String boardData) {
        try {
            WhiteboardSnapshot snapshot = snapshotRepository.findByRoomId(roomId)
                    .orElseGet(() -> WhiteboardSnapshot.builder().roomId(roomId).build());
            snapshot.setBoardData(boardData);
            snapshot.setUpdatedAt(Instant.now());
            snapshotRepository.save(snapshot);
        } catch (DataIntegrityViolationException e) {
            snapshotRepository.findByRoomId(roomId).ifPresent(existing -> {
                existing.setBoardData(boardData);
                existing.setUpdatedAt(Instant.now());
                snapshotRepository.save(existing);
            });
        }
    }

    public String getSnapshot(Long roomId) {
        return snapshotRepository.findByRoomId(roomId)
                .map(WhiteboardSnapshot::getBoardData)
                .orElse("[]");
    }
}
