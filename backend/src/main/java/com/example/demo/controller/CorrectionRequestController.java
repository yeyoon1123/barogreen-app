// src/main/java/com/example/demo/controller/CorrectionRequestController.java
package com.example.demo.controller;

import com.example.demo.model.CorrectionRequest;
import com.example.demo.service.CorrectionRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/correction-requests")
public class CorrectionRequestController {

    private final CorrectionRequestService correctionRequestService;

    public CorrectionRequestController(CorrectionRequestService correctionRequestService) {
        this.correctionRequestService = correctionRequestService;
    }

    /** 업체 앱에서 정정요청 생성 */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Object rid = body.get("reportId");
        String reason = (String) body.getOrDefault("reason", "");
        String requesterLoginId = (String) body.getOrDefault("requesterLoginId", "");

        if (rid == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "reportId is required"));
        }
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "reason is required"));
        }

        Long reportId = (rid instanceof Number)
                ? ((Number) rid).longValue()
                : Long.parseLong(rid.toString());

        correctionRequestService.create(reportId, reason, requesterLoginId);

        return ResponseEntity.ok(Map.of("ok", true));
    }

    /** 관리자 웹 /edit 에서 목록 조회 */
    @GetMapping
    public List<CorrectionRequest> list() {
        return correctionRequestService.findAll();
    }

    /** 관리자 웹에서 상태 변경 (APPROVED / REJECTED) */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "status is required"));
        }
        correctionRequestService.updateStatus(id, status);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
