package com.epharma.ecosystem.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Custom health check controller for UI-friendly responses
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "epharma-backend");
        health.put("timestamp", Instant.now().toString());
        health.put("java_version", System.getProperty("java.version"));
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("application", "Epharma Ecosystem Backend");
        status.put("version", "1.0.0");
        status.put("status", "running");
        status.put("uptime_seconds", getUptime());
        
        return ResponseEntity.ok(status);
    }

    private long getUptime() {
        return (System.currentTimeMillis() - getStartTime()) / 1000;
    }

    private static final long START_TIME = System.currentTimeMillis();
    
    private long getStartTime() {
        return START_TIME;
    }
}
