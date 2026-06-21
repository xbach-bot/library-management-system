package com.library.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PingController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        try {
            jdbcTemplate.execute("SELECT 1");
            return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "database", "UP",
                    "message", "pong"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "DOWN",
                    "database", "DOWN",
                    "error", e.getMessage()
            ));
        }
    }
}

