package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.mapper.ReportMapper;
import com.example.demo.model.Report;

@Service
public class ReportServiceImpl implements ReportService {

    private final ReportMapper reportMapper;

    public ReportServiceImpl(ReportMapper reportMapper) {
        this.reportMapper = reportMapper;
    }

    @Override
    @Transactional
    public Report create(Report report) {
        if (report.getStatus() == null || report.getStatus().isBlank()) {
            report.setStatus("pending");
        } else {
            report.setStatus(report.getStatus().toLowerCase());
        }
        reportMapper.insert(report);
        return reportMapper.findById(report.getReportId());
    }

    @Override
    public Report get(Long id) {
        return reportMapper.findById(id);
    }

    @Override
    public List<Report> findByViewport(double swLat, double swLng, double neLat, double neLng) {
        return reportMapper.findByViewport(swLat, swLng, neLat, neLng);
    }

    @Override
    public List<Report> list(String q, String status, int page, int size) {
        int offset = Math.max(page, 0) * Math.max(size, 1);
        return reportMapper.searchPaged(q, status, offset, size);
    }

    @Override
    public int count(String q, String status) {
        return reportMapper.countSearch(q, status);
    }

    @Override
    @Transactional
    public boolean updateStatus(Long id, String status) {
        return reportMapper.updateStatus(id, status == null ? "pending" : status.toLowerCase()) > 0;
    }
    
    @Override
    @Transactional
    public boolean updateStatus(Long id, String status, String completedPhotoOrNull) {
        String normalized = (status == null ? "pending" : status.toLowerCase());
        String photoToSave = "completed".equals(normalized) ? completedPhotoOrNull : null;
        return reportMapper.updateStatusAndPhoto(id, normalized, photoToSave) > 0;
    }

    @Override
    @Transactional
    public boolean remove(Long id) {
        return reportMapper.deleteById(id) > 0;
    }
    
  
}
