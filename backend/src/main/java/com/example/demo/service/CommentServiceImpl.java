package com.example.demo.service;

import com.example.demo.mapper.CommentMapper;
import com.example.demo.model.Comment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentMapper mapper;

    public CommentServiceImpl(CommentMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public List<Comment> listByPost(Long postId, int page, int size) {
        int safeSize = Math.max(1, size);
        int safePage = Math.max(0, page);
        int offset = safePage * safeSize;
        return mapper.listByPost(postId, offset, safeSize);
    }

    @Override
    @Transactional
    public Comment create(Comment c) {
        mapper.insert(c);
        return mapper.findById(c.getId());
    }

    @Override
    @Transactional
    public boolean delete(Long postId, Long id) {
        return mapper.deleteByIdAndPostId(id, postId) > 0;
    }

    @Override
    @Transactional
    public boolean remove(Long id) {                // ✅ 공개 삭제(id만)
        return mapper.deleteById(id) > 0;
    }
}
