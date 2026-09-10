package com.studyboard.repository;

import com.studyboard.entity.ExportedFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExportedFileRepository extends JpaRepository<ExportedFile, Long> {
    List<ExportedFile> findByRoomIdOrderByCreatedAtDesc(Long roomId);
    void deleteByRoomId(Long roomId);
}