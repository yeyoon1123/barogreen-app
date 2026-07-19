package com.example.demo.service;

import java.util.List;
import com.example.demo.model.AdminUser;

public interface AdminUserService {
    List<AdminUser> find(String q, String status, int page, int size);
    int count(String q, String status);
    boolean update(String email, String name, String status);
    boolean delete(String email);
}
