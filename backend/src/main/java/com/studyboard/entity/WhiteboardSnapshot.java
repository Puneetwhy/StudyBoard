package com.studyboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Stores the latest serialized whiteboard state (JSON array of strokes/shapes)
 * per room, so a user who joins late (or reloads) can restore the board.
 * Live sync happens over WebSocket; this is the persistence checkpoint.
 */
@Entity
@Table(name = "whiteboard_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WhiteboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, unique = true)
    private Long roomId;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String boardData;

    @Builder.Default
    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
