package com.example.demo.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.example.demo.model.AdminUser;

@Mapper
public interface AdminUserMapper {
    List<AdminUser> find(@Param("q") String q,
                         @Param("status") String status,
                         @Param("offset") int offset,
                         @Param("size") int size);

    int count(@Param("q") String q,
              @Param("status") String status);

    int updateByEmail(@Param("email") String email,
                      @Param("name") String name,
                      @Param("status") String status);

    int deleteByEmail(@Param("email") String email);
}
