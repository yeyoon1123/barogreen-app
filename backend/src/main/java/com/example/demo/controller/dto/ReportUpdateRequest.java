package com.example.demo.controller.dto;

public class ReportUpdateRequest {
    private String status;
    private String department;

    public ReportUpdateRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
