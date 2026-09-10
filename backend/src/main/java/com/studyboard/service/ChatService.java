package com.studyboard.service;

import com.studyboard.dto.ChatMessageDto;
import com.studyboard.entity.ChatMessage;
import com.studyboard.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;

    public ChatMessageDto saveMessage(ChatMessageDto dto) {
        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .roomId(dto.getRoomId())
                .senderId(dto.getSenderId())
                .senderName(dto.getSenderName())
                .content(dto.getContent())
                .build());

        return ChatMessageDto.builder()
                .roomId(saved.getRoomId())
                .senderId(saved.getSenderId())
                .senderName(saved.getSenderName())
                .content(saved.getContent())
                .sentAt(saved.getSentAt())
                .build();
    }

    public List<ChatMessageDto> getHistory(Long roomId) {
        return chatMessageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(m -> ChatMessageDto.builder()
                        .roomId(m.getRoomId())
                        .senderId(m.getSenderId())
                        .senderName(m.getSenderName())
                        .content(m.getContent())
                        .sentAt(m.getSentAt())
                        .build())
                .toList();
    }
}
