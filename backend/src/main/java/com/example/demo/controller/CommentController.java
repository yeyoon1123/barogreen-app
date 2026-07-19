// src/main/java/com/example/demo/controller/CommentController.java
package com.example.demo.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Comment;
import com.example.demo.service.CommentService;

@RestController
@RequestMapping("/api")
public class CommentController {

  private final CommentService service;
  public CommentController(CommentService service) { this.service = service; }

  // 공개: /api/posts/{postId}/comments  (이미 있으시면 유지)
  @GetMapping("/posts/{postId}/comments")
  public List<Comment> listByPost(@PathVariable Long postId,
                                  @RequestParam(defaultValue="0") int page,
                                  @RequestParam(defaultValue="100") int size) {
    return service.listByPost(postId, page, size);
  }

  @PostMapping("/posts/{postId}/comments")
  public Comment createUnderPost(@PathVariable Long postId, @RequestBody Comment body) {
    body.setPostId(postId);
    return service.create(body);
  }

  // ✅ 쿼리형: /api/comments?postId=7
  @GetMapping("/comments")
  public List<Comment> listByQuery(@RequestParam Long postId,
                                   @RequestParam(defaultValue="0") int page,
                                   @RequestParam(defaultValue="100") int size) {
    return service.listByPost(postId, page, size);
  }

  // ✅ 바디형: 앱이 {postId, author, content} 로 보내도 수용 (/api/comments)
  @PostMapping("/comments")
  public Comment createBody(@RequestBody Comment body) {
    return service.create(body);
  }

  // ✅ 앱에서 종종 쓰는 네임스페이스도 받기 (/api/app/comments)
  @PostMapping("/app/comments")
  public Comment createApp(@RequestBody Comment body) {
    return service.create(body);
  }

  // 관리자 삭제 외 공개 삭제 필요 시(옵션)
  @DeleteMapping("/comments/{id}")
  public Map<String, Object> remove(@PathVariable Long id) {
    boolean ok = service.remove(id);
    return Map.of("ok", ok);
  }
}
