package com.example.demo.mapper;

import com.example.demo.model.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {

    void insert(Notification notification);

    List<Notification> findByLoginId(@Param("loginId") String loginId);
}
