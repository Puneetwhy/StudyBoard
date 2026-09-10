package com.studyboard.service;

import com.studyboard.dto.RoomResponse;
import com.studyboard.dto.RoomSummaryResponse;
import com.studyboard.entity.Room;
import com.studyboard.entity.RoomMember;
import com.studyboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WhiteboardSnapshotRepository whiteboardSnapshotRepository;
    private final SummaryRepository summaryRepository;
    private final ExportedFileRepository exportedFileRepository;

    public RoomResponse createRoom(String name, Long creatorUserId) {
        String joinCode = generateUniqueJoinCode();

        Room room = Room.builder()
                .name(name)
                .joinCode(joinCode)
                .createdBy(creatorUserId)
                .build();
        room = roomRepository.save(room);

        roomMemberRepository.save(RoomMember.builder()
                .roomId(room.getId())
                .userId(creatorUserId)
                .build());

        return toResponse(room, creatorUserId);
    }

    public RoomResponse joinRoom(String joinCode, Long userId) {
        Room room = roomRepository.findByJoinCode(joinCode.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("No room found with that join code"));

        if (!roomMemberRepository.existsByRoomIdAndUserId(room.getId(), userId)) {
            roomMemberRepository.save(RoomMember.builder()
                    .roomId(room.getId())
                    .userId(userId)
                    .build());
        }

        return toResponse(room, userId);
    }

    public RoomResponse getRoom(Long roomId, Long requesterId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        return toResponse(room, requesterId);
    }

    public List<RoomSummaryResponse> listRoomsForUser(Long userId) {
        List<RoomMember> memberships = roomMemberRepository.findByUserIdOrderByJoinedAtDesc(userId);

        return memberships.stream()
                .map(m -> roomRepository.findById(m.getRoomId())
                        .map(room -> RoomSummaryResponse.builder()
                                .id(room.getId())
                                .name(room.getName())
                                .joinCode(room.getJoinCode())
                                .createdBy(room.getCreatedBy())
                                .owner(room.getCreatedBy().equals(userId))
                                .createdAt(room.getCreatedAt())
                                .lastJoinedAt(m.getJoinedAt())
                                .build())
                        .orElse(null))
                .filter(r -> r != null)
                .toList();
    }

    public RoomResponse renameRoom(Long roomId, Long userId, String newName) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        assertOwner(room, userId);
        room.setName(newName);
        room = roomRepository.save(room);
        return toResponse(room, userId);
    }

    @Transactional
    public void deleteRoom(Long roomId, Long userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found"));
        assertOwner(room, userId);

        chatMessageRepository.deleteByRoomId(roomId);
        whiteboardSnapshotRepository.deleteByRoomId(roomId);
        summaryRepository.deleteByRoomId(roomId);
        exportedFileRepository.deleteByRoomId(roomId);
        roomMemberRepository.deleteByRoomId(roomId);
        roomRepository.delete(room);
    }

    public void assertMember(Long roomId, Long userId) {
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new IllegalArgumentException("You are not a member of this room");
        }
    }

    private void assertOwner(Room room, Long userId) {
        if (!room.getCreatedBy().equals(userId)) {
            throw new IllegalArgumentException("Only the room creator can do this");
        }
    }

    private String generateUniqueJoinCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (roomRepository.existsByJoinCode(code));
        return code;
    }

    private RoomResponse toResponse(Room room, Long requesterId) {
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .joinCode(room.getJoinCode())
                .createdBy(room.getCreatedBy())
                .owner(room.getCreatedBy().equals(requesterId))
                .createdAt(room.getCreatedAt())
                .build();
    }
}
