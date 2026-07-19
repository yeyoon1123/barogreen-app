// src/main/java/com/example/demo/controller/NotificationController.java
package com.example.demo.controller;

import com.example.demo.mapper.NotificationMapper;
import com.example.demo.model.Notification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationMapper notificationMapper;

    public NotificationController(NotificationMapper notificationMapper) {
        this.notificationMapper = notificationMapper;
    }

    // GET /api/notifications?loginId=xxx
    @GetMapping
    public ResponseEntity<?> getMyNotifications(@RequestParam("loginId") String loginId) {
        if (loginId == null || loginId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("loginId is required");
        }

        // ✅ 여기서 Mapper 메서드명도 findByLoginId 로 맞추기
        List<Notification> list = notificationMapper.findByLoginId(loginId);

        Map<String, Object> body = new HashMap<>();
        body.put("notifications", list);
        return ResponseEntity.ok(body);
    }
}
