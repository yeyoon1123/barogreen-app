package com.example.demo.service;

import com.example.demo.mapper.UserMapper;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    /** 회원 가입 */
    public void registerUser(User user) {
        if (user.getStatus() == null || user.getStatus().isEmpty()) {
            user.setStatus("ACTIVE"); // 기본 활성
        }
        userMapper.insertUser(user);
    }

    /** 비밀번호 재설정 */
    public void resetPassword(String email, String newPassword) {
        userMapper.updatePassword(email, newPassword);
    }

    /** 이메일로 사용자 조회 */
    public User getUserByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    /** 이메일 존재 여부 */
    public boolean existsByEmail(String email) {
        return userMapper.existsByEmail(email) > 0;
    }

    /** 로그인: ACTIVE 계정만 */
    public User authenticate(String email, String password) {
        return userMapper.findActiveByCredentials(email, password);
    }
}
