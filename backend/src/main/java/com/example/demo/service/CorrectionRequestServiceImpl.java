// src/main/java/com/example/demo/service/CorrectionRequestServiceImpl.java
package com.example.demo.service;

import com.example.demo.mapper.CorrectionRequestMapper;
import com.example.demo.model.CorrectionRequest;
import com.example.demo.model.Report;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service   // 🔴 이거 빠지면 에러 남
@Transactional
public class CorrectionRequestServiceImpl implements CorrectionRequestService {

    private final CorrectionRequestMapper mapper;
    private final ReportService reportService; // ✅ 신고 정보 가져오기용

    public CorrectionRequestServiceImpl(CorrectionRequestMapper mapper,
                                        ReportService reportService) {
        this.mapper = mapper;
        this.reportService = reportService;
    }

    @Override
    public void create(Long reportId, String reason, String requesterLoginId) {
        // ✅ 신고에서 reporterId(이메일/guest)를 한 번 읽어서 복사
        Report report = reportService.get(reportId);
        String reporterId = null;
        if (report != null) {
            reporterId = report.getReporterId();  // REPORTS.REPORTER_ID
        }

        CorrectionRequest req = new CorrectionRequest();
        req.setReportId(reportId);
        req.setReason(reason);
        req.setStatus("PENDING");
        req.setRequesterLoginId(requesterLoginId);
        req.setReporterId(reporterId);  // 🔥 포인트: 정정요청에 신고자 정보 저장

        mapper.insert(req);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CorrectionRequest> findAll() {
        return mapper.findAll();
    }

    @Override
    public void updateStatus(Long id, String status) {
        mapper.updateStatus(id, status);
    }

    @Override
    public void markResolvedByReportId(Long reportId) {
        mapper.markResolvedByReportId(reportId);
    }
}
