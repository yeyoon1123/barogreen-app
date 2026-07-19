package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.service.CommentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/posts/{postId}/comments")
public class AdminCommentController {

    private final CommentService service;

    public AdminCommentController(CommentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Comment> list(@PathVariable Long postId,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "100") int size) {
    	return service.listByPost(postId, page, size); // ← 메서드명 통일
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long postId,
                                      @PathVariable Long id) {
        boolean ok = service.delete(postId, id); // ← postId도 검증에 사용
        return Map.of("ok", ok);
    }
}
