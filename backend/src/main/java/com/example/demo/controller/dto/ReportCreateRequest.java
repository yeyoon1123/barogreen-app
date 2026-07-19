package com.example.demo.controller.dto;

public class ReportCreateRequest {
    private Double lat;
    private Double lng;
    private String note;
    private String photoUri; // 업로드 후 URL or 비어있을 수 있음
    private String address;
    private String category;
    private String reporterId; 
    
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getPhotoUri() { return photoUri; }
    public void setPhotoUri(String photoUri) { this.photoUri = photoUri; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
 // ✅ 추가: 게터/세터
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    // ✅ reporterId getter/setter
    public String getReporterId() {
        return reporterId;
    }

    public void setReporterId(String reporterId) {
        this.reporterId = reporterId;
    }
}
