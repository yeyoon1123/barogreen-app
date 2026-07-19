package com.example.demo.mapper;

import com.example.demo.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    void insertUser(User user);

    void updatePassword(@Param("email") String email,
                        @Param("password") String password);

    User findByEmail(@Param("email") String email);

    int existsByEmail(@Param("email") String email);

    // 로그인 시도: ACTIVE 인 계정만
    User findActiveByCredentials(@Param("email") String email,
                                 @Param("password") String password);
}
