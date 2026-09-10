package com.studyboard.repository;

import com.studyboard.entity.WhiteboardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WhiteboardSnapshotRepository extends JpaRepository<WhiteboardSnapshot, Long> {
    Optional<WhiteboardSnapshot> findByRoomId(Long roomId);
    void deleteByRoomId(Long roomId);
}