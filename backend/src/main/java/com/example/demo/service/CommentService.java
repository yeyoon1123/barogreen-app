package com.example.demo.service;

import com.example.demo.model.Comment;
import java.util.List;

public interface CommentService {
    List<Comment> listByPost(Long postId, int page, int size);
    Comment create(Comment c);

    // 관리자용: 특정 게시글(postId)에 속한 댓글만 삭제
    boolean delete(Long postId, Long id);

    // ✅ 공개용: id만으로 댓글 삭제 (컨트롤러 @DeleteMapping("/api/comments/{id}")에서 사용)
    boolean remove(Long id);
}
