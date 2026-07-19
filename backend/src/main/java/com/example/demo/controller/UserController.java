package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    // 회원가입
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        userService.registerUser(user);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "회원가입 성공");
        response.put("email", user.getEmail());
        response.put("name", user.getName());
        return ResponseEntity.ok(response);
    }

    // 로그인 (JSON 응답) : ACTIVE 계정만 통과
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        // 1) ACTIVE 계정 + 비밀번호 일치
        User activeUser = userService.authenticate(email, password);
        if (activeUser != null) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "로그인 성공");
            response.put("name", activeUser.getName());
            response.put("email", activeUser.getEmail());
            return ResponseEntity.ok(response);
        }

        // 2) 에러 사유를 좀 더 친절히 분기
        User byEmail = userService.getUserByEmail(email);
        Map<String, String> error = new HashMap<>();

        if (byEmail == null) {
            error.put("error", "회원가입된 정보가 없습니다.");
            return ResponseEntity.status(401).body(error);
        }

        if (!byEmail.getPassword().equals(password)) {
            error.put("error", "비밀번호가 일치하지 않습니다.");
            return ResponseEntity.status(401).body(error);
        }

        // 비활성 상태
        if (!"ACTIVE".equalsIgnoreCase(byEmail.getStatus())) {
            error.put("error", "비활성화된 계정입니다. 관리자에게 문의하세요.");
            return ResponseEntity.status(403).body(error);
        }

        // 일반적으로 여기 도달하지 않음
        error.put("error", "로그인에 실패했습니다.");
        return ResponseEntity.status(401).body(error);
    }

    // 비밀번호 재설정
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String newPassword = payload.get("newPassword");
        userService.resetPassword(email, newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("message", "비밀번호 변경 완료");
        return ResponseEntity.ok(response);
    }
}
