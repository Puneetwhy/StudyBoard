package com.studyboard.repository;

import com.studyboard.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    List<RoomMember> findByRoomId(Long roomId);
    List<RoomMember> findByUserIdOrderByJoinedAtDesc(Long userId);
    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
    void deleteByRoomId(Long roomId);
}