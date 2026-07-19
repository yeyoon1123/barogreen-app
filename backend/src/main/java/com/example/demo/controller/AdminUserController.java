package com.example.demo.controller;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.demo.service.AdminUserService;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://127.0.0.1:3000"},
    allowCredentials = "false"
)
public class AdminUserController {

    @Autowired
    private AdminUserService svc;

    @GetMapping
    public Map<String, Object> list(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return Map.of(
            "items", svc.find(q, status, page, size),
            "total", svc.count(q, status)
        );
    }

    @PutMapping("/{email}")
    public boolean updateStatus(
        @PathVariable String email,
        @RequestBody Map<String, String> body
    ) {
        String name = body.get("name");
        String status = body.get("status");
        return svc.update(email, name, status);
    }

    @DeleteMapping("/{email}")
    public boolean delete(@PathVariable String email) {
        return svc.delete(email);
    }
}
