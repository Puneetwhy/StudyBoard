package com.studyboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "exported_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    /** WHITEBOARD or NOTES */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 150)
    private String fileName;

    @Column(nullable = false, length = 500)
    private String url;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
