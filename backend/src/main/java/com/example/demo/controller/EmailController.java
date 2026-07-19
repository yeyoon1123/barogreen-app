package com.example.demo.controller;

import com.example.demo.service.EmailService;
import com.example.demo.service.UserService;
import com.example.demo.util.CodeStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
public class EmailController {

    private static final Logger log = LoggerFactory.getLogger(EmailController.class);

    private final EmailService emailService;
    private final UserService userService;

    public EmailController(EmailService emailService, UserService userService) {
        this.emailService = emailService;
        this.userService = userService;
    }

    /** (비밀번호 재설정) 기존 계정만 허용 */
    @PostMapping("/send-code")
    public ResponseEntity<String> sendResetCode(@RequestParam String email) {
        log.info("[send-reset-code] email={}", email);
        boolean exists = userService.existsByEmail(email);
        log.info("[send-reset-code] existsByEmail({}) = {}", email, exists);

        if (!exists) {
            return ResponseEntity.status(404).body("USER_NOT_FOUND");
        }

        // ✅ 수신자에는 순수 email, purpose는 별도 인자로
        emailService.sendVerificationCode(email, "reset");
        return ResponseEntity.ok("OK");
    }

    /** (회원가입) 신규 이메일만 허용 */
    @PostMapping("/send-signup-code")
    public ResponseEntity<String> sendSignupCode(@RequestParam String email) {
        log.info("[send-signup-code] email={}", email);
        boolean exists = userService.existsByEmail(email);
        log.info("[send-signup-code] existsByEmail({}) = {}", email, exists);

        if (exists) {
            return ResponseEntity.status(409).body("EMAIL_ALREADY_EXISTS");
        }

        // ✅ 수신자에는 순수 email, purpose는 별도 인자로
        emailService.sendVerificationCode(email, "signup");
        return ResponseEntity.ok("OK");
    }

    /** 공용 코드 검증 (purpose: signup | reset) */
    @PostMapping("/verify-code")
    public ResponseEntity<Boolean> verifyCode(
            @RequestParam String email,
            @RequestParam String code,
            @RequestParam(defaultValue = "reset") String purpose
    ) {
        String key = (purpose + ":" + email).toLowerCase();
        log.info("[verify-code] key={}, code={}", key, code);
        boolean ok = CodeStore.verifyCode(key, code);
        if (ok) CodeStore.removeCode(key);
        return ResponseEntity.ok(ok);
    }
}
