	package com.example.demo.model;
	
	import java.time.LocalDateTime;
	
	public class Notification {
	
	    private Long id;
	    private String memberLoginId; // 사용자 식별용 (Report.reporterId랑 매칭)
	    private Long reportId;
	    private String message;
	    private LocalDateTime createdAt;
	    private boolean read; // 읽음 여부
	
	    public Long getId() { return id; }
	    public void setId(Long id) { this.id = id; }
	
	    public String getMemberLoginId() { return memberLoginId; }
	    public void setMemberLoginId(String memberLoginId) { this.memberLoginId = memberLoginId; }
	
	    public Long getReportId() { return reportId; }
	    public void setReportId(Long reportId) { this.reportId = reportId; }
	
	    public String getMessage() { return message; }
	    public void setMessage(String message) { this.message = message; }
	
	    public LocalDateTime getCreatedAt() { return createdAt; }
	    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
	
	    public boolean isRead() { return read; }
	    public void setRead(boolean read) { this.read = read; }
	}
