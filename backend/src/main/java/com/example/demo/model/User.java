package com.example.demo.model;

import java.util.Date;

public class User {
    private String email;
    private String name;
    private String password;
    private String status;   // 'ACTIVE' | 'INACTIVE'
    private Date joinedAt;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Date joinedAt) { this.joinedAt = joinedAt; }
}
