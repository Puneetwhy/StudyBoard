package com.studyboard.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over WebSocket configuration for chat + whiteboard sync + WebRTC signaling.
 * Render terminates TLS at the edge, so the same endpoint is reachable as wss://
 * from the deployed frontend without any backend changes (frontend builds the
 * ws:// vs wss:// scheme dynamically from window.location).
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket endpoint (frontend connects with @stomp/stompjs directly,
        // building ws:// or wss:// dynamically from window.location — no SockJS needed).
        registry.addEndpoint("/ws")
                .setAllowedOrigins(frontendUrl.split(","));
    }
}
