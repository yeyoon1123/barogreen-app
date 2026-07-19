package com.example.demo.model;

public class AdminUser {
    private String email;
    private String name;
    private String password;
    private String status;
    private java.util.Date joinedAt;

    // === Getter / Setter ===
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    public java.util.Date getJoinedAt() {
        return joinedAt;
    }
    public void setJoinedAt(java.util.Date joinedAt) {
        this.joinedAt = joinedAt;
    }
}
