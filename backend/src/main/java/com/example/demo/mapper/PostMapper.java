package com.example.demo.mapper;

import com.example.demo.model.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PostMapper {

    // Public
    List<Post> findVisible();                       // 숨김 제외 목록
    List<Post> findAll();                           // 전체(관리자에서만 사용)
    Post findById(@Param("id") Long id);
    int insert(Post post);
    int update(Post post);
    int delete(@Param("id") Long id, @Param("author") String author);

    // Admin 목록/카운트
    List<Post> findList(@Param("q") String q,
                        @Param("hidden") Integer hidden,
                        @Param("offset") int offset,
                        @Param("limit") int limit);

    int count(@Param("q") String q,
              @Param("hidden") Integer hidden);

    // Admin 제어
    int updateHidden(@Param("id") Long id,
                     @Param("hidden") Integer hidden);

    int deleteById(@Param("id") Long id);
}
