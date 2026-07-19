package com.example.demo.service;

import com.example.demo.mapper.PostMapper;
import com.example.demo.model.Post;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostMapper postMapper;
    public PostServiceImpl(PostMapper postMapper) { this.postMapper = postMapper; }

    // 공개
    @Override
    public List<Post> getAllPosts() { return postMapper.findVisible(); }

    @Override
    public Post getPost(Long id) { return postMapper.findById(id); }

    @Override @Transactional
    public Post createPost(Post post) {
        postMapper.insert(post);
        return postMapper.findById(post.getId());
    }

    @Override @Transactional
    public boolean updatePost(Post post) { return postMapper.update(post) > 0; }

    @Override @Transactional
    public boolean deletePost(Long id, String author) { return postMapper.delete(id, author) > 0; }

    // 관리자
    @Override
    public List<Post> getAllPostsForAdmin() { return postMapper.findAll(); }

    @Override @Transactional
    public boolean updateHidden(Long id, Integer hidden) { return postMapper.updateHidden(id, hidden) > 0; }
}
