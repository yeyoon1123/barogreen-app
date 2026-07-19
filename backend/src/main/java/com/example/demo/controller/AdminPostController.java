package com.example.demo.controller;

import com.example.demo.mapper.PostMapper;
import com.example.demo.model.Post;
import com.example.demo.service.PostService;
import com.example.demo.controller.dto.PagedResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/posts")
public class AdminPostController {

    private final PostMapper mapper;
    private final PostService postService;

    public AdminPostController(PostMapper mapper, PostService postService) {
        this.mapper = mapper;
        this.postService = postService;
    }

    // 목록: q(검색), hidden(0/1,true/false), page,size
    @GetMapping
    public PagedResponse<Post> list(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) String hidden,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "50") int size) {
        int offset = Math.max(0, page) * Math.max(1, size);
        int limit  = Math.max(1, size);

        Integer hiddenInt = parseHidden(hidden); // null / 0 / 1
        List<Post> items = mapper.findList(q, hiddenInt, offset, limit);
        int total = mapper.count(q, hiddenInt);

        return new PagedResponse<>(items, total, page, size);
    }

    @GetMapping("/{id}")
    public Post get(@PathVariable Long id) {
        return postService.getPost(id);
    }

    // hidden 토글/업데이트만 허용
    @PutMapping("/{id}")
    public Map<String, Object> updateHidden(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body) {
        Object v = body.get("hidden");
        Integer hidden = toInt01(v); // 0/1
        boolean ok = postService.updateHidden(id, hidden);
        return Map.of("ok", ok);
    }

    // 강제 삭제(작성자 무시)
    @DeleteMapping("/{id}")
    public Map<String, Object> delete(@PathVariable Long id) {
        boolean ok = mapper.deleteById(id) > 0;
        return Map.of("ok", ok);
    }

    private static Integer toInt01(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.intValue() != 0 ? 1 : 0;
        String s = v.toString().trim().toLowerCase();
        return ("1".equals(s) || "true".equals(s) || "y".equals(s) || "yes".equals(s)) ? 1 : 0;
    }

    private static Integer parseHidden(String s) {
        if (s == null || s.isBlank()) return null;
        s = s.trim().toLowerCase();
        if ("1".equals(s) || "true".equals(s) || "y".equals(s) || "yes".equals(s)) return 1;
        if ("0".equals(s) || "false".equals(s) || "n".equals(s) || "no".equals(s))  return 0;
        return null;
        // 잘못된 값이면 필터 미적용(null)로 처리
    }
}
