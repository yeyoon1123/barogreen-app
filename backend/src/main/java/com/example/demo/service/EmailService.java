package com.example.demo.service;

import com.example.demo.util.CodeStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ThreadLocalRandom;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from; // 보내는 주소(메일 계정과 동일)

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private String generate6digit() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
    }

    /**
     * 인증코드 전송
     * @param email   순수 이메일 주소(프리픽스 금지)
     * @param purpose "signup" | "reset"
     */
    public String sendVerificationCode(String email, String purpose) {
        final String trimmedEmail = email.trim();
        final String key = (purpose + ":" + trimmedEmail).toLowerCase(); // CodeStore 키는 prefix 포함

        final String code = generate6digit();

        try {
            // 1) 코드 저장 (키는 purpose:email)
            CodeStore.saveCode(key, code);

            // 2) 메일 전송 (수신자는 순수 이메일)
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(trimmedEmail);                 // ✅ 절대 prefix 넣지 말 것
            message.setSubject("[BaroGreen] " + ("signup".equals(purpose) ? "회원가입" : "비밀번호 재설정") + " 인증코드");
            message.setText("인증코드: " + code + "\n유효시간: 5분");

            mailSender.send(message);
            System.out.println("[MAIL] sent code " + code + " to " + trimmedEmail + " (key=" + key + ")");
            return code;
        } catch (MailException e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "메일 전송 실패: " + e.getMessage());
        }
    }
}
