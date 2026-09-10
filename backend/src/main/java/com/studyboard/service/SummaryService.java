package com.studyboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyboard.dto.ChatMessageDto;
import com.studyboard.dto.SummaryResponse;
import com.studyboard.entity.Summary;
import com.studyboard.repository.SummaryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Calls an external AI API (Anthropic Messages API by default) to summarize
 * a room's chat transcript, then persists the result so it survives restarts.
 */
@Service
@RequiredArgsConstructor
public class SummaryService {

    private final ChatService chatService;
    private final SummaryRepository summaryRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl;

    @Value("${ai.api.model}")
    private String model;

    public SummaryResponse summarizeRoom(Long roomId) {
        List<ChatMessageDto> history = chatService.getHistory(roomId);

        if (history.isEmpty()) {
            throw new IllegalArgumentException("No chat history yet for this room to summarize");
        }

        String transcript = history.stream()
                .map(m -> m.getSenderName() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));

        String summaryText = callAiApi(transcript);

        Summary saved = summaryRepository.save(Summary.builder()
                .roomId(roomId)
                .content(summaryText)
                .build());

        return SummaryResponse.builder()
                .id(saved.getId())
                .roomId(saved.getRoomId())
                .content(saved.getContent())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<SummaryResponse> getSummaries(Long roomId) {
        return summaryRepository.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(s -> SummaryResponse.builder()
                        .id(s.getId())
                        .roomId(s.getRoomId())
                        .content(s.getContent())
                        .createdAt(s.getCreatedAt())
                        .build())
                .toList();
    }

    private String callAiApi(String transcript) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI_API_KEY is not configured on the backend");
        }

        WebClient client = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("content-type", "application/json")
                .build();

        String prompt = "Summarize this study room chat session into concise bullet points "
                + "covering key topics discussed, decisions made, and action items:\n\n" + transcript;

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1000,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        JsonNode response = client.post()
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();

        if (response == null || !response.has("content")) {
            throw new RuntimeException("AI summarization API returned an unexpected response");
        }

        StringBuilder text = new StringBuilder();
        for (JsonNode block : response.get("content")) {
            if (block.has("text")) {
                text.append(block.get("text").asText());
            }
        }
        return text.toString();
    }
}
