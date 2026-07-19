package com.example.demo.model;

import java.time.LocalDateTime;

public class Report {
    private Long reportId;
    private Double lat;
    private Double lng;
    private String status;      // 'pending' | 'processing' | 'completed' (소문자)
    private String photoUri;
    private String address;
    private String note;
    private LocalDateTime reportedAt;
    private String completedPhoto;

    // ✅ 추가된 필드
    private String category;      // DB CATEGORY 컬럼 값
    private String trashType;     // 프론트 호환용 (category 미러)
    private String trashTypeLabel;// 프론트 호환용 (category 미러)

    

    // ✅ 신고자 아이디
    private String reporterId;
    
    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }

    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPhotoUri() { return photoUri; }
    public void setPhotoUri(String photoUri) { this.photoUri = photoUri; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime reportedAt) { this.reportedAt = reportedAt; }

    public String getCompletedPhoto() { return completedPhoto; }
    public void setCompletedPhoto(String completedPhoto) { this.completedPhoto = completedPhoto; }

    // ✅ category 관련 getter/setter 추가
    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
        this.trashType = category;        // 프론트에서 동일하게 접근 가능
        this.trashTypeLabel = category;   // 프론트 호환
    }

    public String getTrashType() {
        return trashType;
    }

    public void setTrashType(String trashType) {
        this.trashType = trashType;
    }

    public String getTrashTypeLabel() {
        return trashTypeLabel;
    }

    public void setTrashTypeLabel(String trashTypeLabel) {
        this.trashTypeLabel = trashTypeLabel;
    }
    // ✅ reporterId getter/setter
    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }
}
