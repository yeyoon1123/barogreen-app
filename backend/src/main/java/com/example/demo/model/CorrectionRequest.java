package com.example.demo.model;

import java.time.LocalDateTime;

public class CorrectionRequest {

    private Long id;
    private Long reportId;
    private String reason;
    private String status;            // PENDING / APPROVED / REJECTED / RESOLVED
    private String requesterLoginId;  // 요청 보낸 업체 로그인ID
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

 // ✅ 신고자 로그인ID/표시용 (REPORTS.REPORTER_ID)
    private String reporterId;
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRequesterLoginId() { return requesterLoginId; }
    public void setRequesterLoginId(String requesterLoginId) { this.requesterLoginId = requesterLoginId; }
  
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
}
