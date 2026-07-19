	package com.example.demo.service;
	
	import com.example.demo.model.CorrectionRequest;
	
	import java.util.List;
	
	public interface CorrectionRequestService {
	
	    void create(Long reportId, String reason, String requesterLoginId);
	
	    List<CorrectionRequest> findAll();
	
	    void updateStatus(Long id, String status);
	
	    void markResolvedByReportId(Long reportId);
	}
