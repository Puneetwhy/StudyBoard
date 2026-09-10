package com.studyboard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoomUpdateRequest {
    @NotBlank
    private String name;
}