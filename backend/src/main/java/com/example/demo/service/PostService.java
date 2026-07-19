package com.example.demo.service;

import com.example.demo.model.Post;
import java.util.List;

public interface PostService {
    // Public
    List<Post> getAllPosts();          // 숨김 제외
    Post getPost(Long id);
    Post createPost(Post post);
    boolean updatePost(Post post);
    boolean deletePost(Long id, String author);

    // Admin
    List<Post> getAllPostsForAdmin();  // 전체
    boolean updateHidden(Long id, Integer hidden);
}
