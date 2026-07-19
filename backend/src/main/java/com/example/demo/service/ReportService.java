package com.example.demo.service;

import com.example.demo.model.Report;

import java.util.List;

public interface ReportService {
    Report create(Report report);

    Report get(Long id);

    List<Report> findByViewport(double swLat, double swLng, double neLat, double neLng);

    // 관리자 리스트 간단 버전
    List<Report> list(String q, String status, int page, int size);
    int count(String q, String status);

    boolean updateStatus(Long id, String status);
    
    boolean remove(Long id);
    
    boolean updateStatus(Long id, String status, String completedPhotoOrNull);
}
