package com.studyboard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoomCreateRequest {
    @NotBlank
    private String name;
}
