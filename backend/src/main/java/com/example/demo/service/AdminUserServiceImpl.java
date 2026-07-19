package com.example.demo.service;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.demo.mapper.AdminUserMapper;
import com.example.demo.model.AdminUser;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    @Autowired
    private AdminUserMapper mapper;

    @Override
    public List<AdminUser> find(String q, String status, int page, int size) {
        int p = Math.max(page, 0);
        int s = Math.max(size, 1);
        return mapper.find(q, status, p * s, s);
    }

    @Override
    public int count(String q, String status) {
        return mapper.count(q, status);
    }

    @Override
    public boolean update(String email, String name, String status) {
        return mapper.updateByEmail(email, name, status) > 0;
    }

    @Override
    public boolean delete(String email) {
        return mapper.deleteByEmail(email) > 0;
    }
}
