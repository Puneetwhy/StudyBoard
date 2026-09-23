package com.studyboard.service;

import com.studyboard.entity.WhiteboardSnapshot;
import com.studyboard.repository.WhiteboardSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class WhiteboardService {

    private final WhiteboardSnapshotRepository snapshotRepository;

    /** Persist the latest full board state so late joiners can restore it. */
    public void saveSnapshot(Long roomId, String boardData) {
        WhiteboardSnapshot snapshot = snapshotRepository.findByRoomId(roomId)
                .orElse(WhiteboardSnapshot.builder().roomId(roomId).build());
        snapshot.setBoardData(boardData);
        snapshot.setUpdatedAt(Instant.now());
        snapshotRepository.save(snapshot);
    }

    public String getSnapshot(Long roomId) {
        return snapshotRepository.findByRoomId(roomId)
                .map(WhiteboardSnapshot::getBoardData)
                .orElse("[]");
    }
}
