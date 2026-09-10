package com.studyboard.repository;

import com.studyboard.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SummaryRepository extends JpaRepository<Summary, Long> {
    List<Summary> findByRoomIdOrderByCreatedAtDesc(Long roomId);
    void deleteByRoomId(Long roomId);
}