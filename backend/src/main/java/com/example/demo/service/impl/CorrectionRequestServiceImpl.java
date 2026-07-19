//package com.example.demo.service;
//
//import com.example.demo.mapper.CorrectionRequestMapper;
//import com.example.demo.model.CorrectionRequest;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.List;
//
//@Service
//@Transactional
//public class CorrectionRequestServiceImpl implements CorrectionRequestService {
//
//    private final CorrectionRequestMapper mapper;
//
//    public CorrectionRequestServiceImpl(CorrectionRequestMapper mapper) {
//        this.mapper = mapper;
//    }
//
//    @Override
//    public void create(Long reportId, String reason, String requesterLoginId) {
//        CorrectionRequest req = new CorrectionRequest();
//        req.setReportId(reportId);
//        req.setReason(reason);
//        req.setStatus("PENDING");           // 기본값
//        req.setRequesterLoginId(requesterLoginId);
//        mapper.insert(req);
//    }
//
//    @Override
//    @Transactional(readOnly = true)
//    public List<CorrectionRequest> findAll() {
//        return mapper.findAll();
//    }
//
//    @Override
//    public void updateStatus(Long id, String status) {
//        mapper.updateStatus(id, status);
//    }
//
//    @Override
//    public void markResolvedByReportId(Long reportId) {
//        mapper.markResolvedByReportId(reportId);
//    }
//}
