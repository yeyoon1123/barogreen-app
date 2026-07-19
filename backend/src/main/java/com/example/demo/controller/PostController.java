package com.example.demo.controller;

import com.example.demo.model.Post;
import com.example.demo.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    public PostController(PostService postService) { this.postService = postService; }

    // 공개 리스트: 숨김 제외
    @GetMapping
    public List<Post> list() { return postService.getAllPosts(); }

    @GetMapping("/{id}")
    public Post get(@PathVariable Long id) { return postService.getPost(id); }

    @PostMapping
    public ResponseEntity<Post> create(@RequestBody Post post) {
      Post saved = postService.createPost(post);
      return ResponseEntity.created(URI.create("/api/posts/" + saved.getId())).body(saved);
    }

    // 공개 수정: 작성자 검증
    @PutMapping("/{id}")
    public ResponseEntity<String> update(@PathVariable Long id, @RequestBody Post post) {
      Post cur = postService.getPost(id);
      if (cur == null) return ResponseEntity.ok("already deleted");
      String a1 = cur.getAuthor() == null ? "" : cur.getAuthor().trim();
      String a2 = post.getAuthor() == null ? "" : post.getAuthor().trim();
      if (!a1.equalsIgnoreCase(a2)) return ResponseEntity.status(403).body("author mismatch");
      post.setId(id);
      return postService.updatePost(post) ? ResponseEntity.ok("updated")
                                          : ResponseEntity.status(500).body("update failed");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, @RequestParam String author) {
      Post cur = postService.getPost(id);
      if (cur == null) return ResponseEntity.ok("already deleted");
      String a1 = cur.getAuthor() == null ? "" : cur.getAuthor().trim();
      if (!a1.equalsIgnoreCase(author == null ? "" : author.trim()))
          return ResponseEntity.status(403).body("author mismatch");
      return postService.deletePost(id, author) ? ResponseEntity.ok("deleted")
                                                : ResponseEntity.status(500).body("delete failed");
    }
}
