	
	package com.example.demo.controller;
	
	import com.example.demo.controller.dto.ReportCreateRequest;
	import com.example.demo.model.Report;
	import com.example.demo.service.ReportService;
	import com.example.demo.util.LocalFileStorage;
	import org.springframework.http.MediaType;
	import org.springframework.http.ResponseEntity;
	import org.springframework.web.bind.annotation.*;
	import org.springframework.web.multipart.MultipartFile;
	
	import java.util.HashMap;
	import java.util.List;
	import java.util.Map;
	
	@RestController
	@RequestMapping("/api/trash")
	public class ReportController {
	
	    private final ReportService reportService;
	    private final LocalFileStorage storage; // ✅ 파일 저장소 주입
	
	    public ReportController(ReportService reportService, LocalFileStorage storage) {
	        this.reportService = reportService;
	        this.storage = storage;
	    }
	
	    /* ================= 업로드(공용) ================= */
	    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	    public ResponseEntity<?> upload(@RequestPart("file") MultipartFile file) throws Exception {
	        if (file == null || file.isEmpty()) {
	            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "file required"));
	        }
	        String url = storage.save(file);
	        return ResponseEntity.ok(Map.of("ok", true, "url", url));
	    }
	
	    /* ================= 조회 ================= */
	    // 뷰포트 내 조회
	    @GetMapping("/reports")
	    public Map<String, Object> list(
	            @RequestParam double neLat,
	            @RequestParam double neLng,
	            @RequestParam double swLat,
	            @RequestParam double swLng
	    ) {
	        List<Report> items = reportService.findByViewport(swLat, swLng, neLat, neLng);
	        Map<String, Object> res = new HashMap<>();
	        res.put("reports", items); // ✅ completedPhoto 포함해 그대로 반환
	        return res;
	    }
	
	    // 단건 조회
	    @GetMapping("/{id}")
	    public Report get(@PathVariable Long id) {
	        return reportService.get(id);
	    }
	
	    /* ================= 생성 ================= */
	    // JSON 전송용
	    @PostMapping(value = "/report", consumes = MediaType.APPLICATION_JSON_VALUE)
	    public ResponseEntity<?> createJson(@RequestBody ReportCreateRequest req) {
	        if (req.getLat() == null || req.getLng() == null) {
	            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "lat/lng required"));
	        }
	        Report r = new Report();
	        r.setLat(req.getLat());
	        r.setLng(req.getLng());
	        r.setNote(req.getNote());
	        r.setPhotoUri(req.getPhotoUri());
	        r.setAddress(req.getAddress());
	        //r.setReporterId(req.getReporterId());
	        r.setStatus("pending");
	
	        // ✅ JSON 경로에서도 category 세팅
	        if (req.getCategory() != null && !req.getCategory().isBlank()) {
	            r.setCategory(req.getCategory());
	        }
	        
	        // ✅ JSON 경로로 들어온 reporterId 세팅
	        if (req.getReporterId() != null && !req.getReporterId().isBlank()) {
	            r.setReporterId(req.getReporterId());
	        }
	        Report saved = reportService.create(r);
	        return ResponseEntity.ok(Map.of("ok", true, "report", saved));
	    }
	
	    // 멀티파트 전송용 (앱에서 바로 파일 업로드 시)
	    @PostMapping(value = "/report-multipart", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	    public ResponseEntity<?> createMultipart(
	            @RequestPart(value = "status",   required = false) String status,
	            @RequestPart(value = "address",  required = false) String address,
	            @RequestPart(value = "note",     required = false) String note,
	            @RequestPart(value = "lat",      required = false) Double lat,
	            @RequestPart(value = "lng",      required = false) Double lng,
	            @RequestPart(value = "category", required = false) String category, // ✅ 추가
	            @RequestPart(value = "file",     required = false) MultipartFile file,
	            @RequestPart(value = "reporterId", required = false) String reporterId
	    ) throws Exception {
	
	        if (lat == null || lng == null) {
	            return ResponseEntity.badRequest().body(Map.of("ok", false, "message", "lat/lng required"));
	        }
	
	        Report r = new Report();
	        r.setLat(lat);
	        r.setLng(lng);
	        r.setAddress(address);
	        r.setNote(note);
	        r.setStatus((status == null || status.isBlank()) ? "pending" : status.toLowerCase());
	        if (category != null && !category.isBlank()) {
	            r.setCategory(category); // ✅ Report.category 세팅
	        }
	        
	        // ✅ 멀티파트에서도 reporterId 세팅
	        if (reporterId != null && !reporterId.isBlank()) {
	            r.setReporterId(reporterId);
	        }
	
	        if (file != null && !file.isEmpty()) {
	            String url = storage.save(file);
	            r.setPhotoUri(url);
	        }
	
	        Report saved = reportService.create(r);
	        return ResponseEntity.ok(Map.of("ok", true, "report", saved));
	    }
	
	    /* ================= 상태 변경 ================= */
	    @PutMapping("/{id}/status")
	    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
	        String status = body.getOrDefault("status", "pending");
	        String photoUri = body.get("photoUri"); // ✅ 완료 사진(선택)
	        boolean ok = reportService.updateStatus(id, status, photoUri);
	        if (!ok) return ResponseEntity.badRequest().body(Map.of("ok", false));
	        return ResponseEntity.ok(Map.of("ok", true));
	    }
	
	    /* ================= 삭제 ================= */
	    @DeleteMapping("/{id}")
	    public Map<String, Object> delete(@PathVariable Long id) {
	        boolean ok = reportService.remove(id);
	        return Map.of("ok", ok);
	    }
	}
	
	
