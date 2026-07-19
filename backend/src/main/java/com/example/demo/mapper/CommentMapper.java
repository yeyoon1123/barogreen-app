package com.example.demo.mapper;

import com.example.demo.model.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommentMapper {

    List<Comment> listByPost(@Param("postId") Long postId,
                             @Param("offset") int offset,
                             @Param("limit") int limit);

    int insert(Comment c);

    Comment findById(@Param("id") Long id);

    int deleteByIdAndPostId(@Param("id") Long id,
                            @Param("postId") Long postId);

    // ✅ 공개 삭제(id만)
    int deleteById(@Param("id") Long id);
}
