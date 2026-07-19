package com.example.demo.mapper;

import com.example.demo.model.Report;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ReportMapper {
    int insert(Report report);

    Report findById(@Param("id") Long id);

    List<Report> findByViewport(
            @Param("swLat") double swLat,
            @Param("swLng") double swLng,
            @Param("neLat") double neLat,
            @Param("neLng") double neLng
    );

    // 관리자 리스트 간단 버전 (q, status만 지원)
    List<Report> searchPaged(
            @Param("q") String q,
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("size") int size
    );

    int countSearch(
            @Param("q") String q,
            @Param("status") String status
    );

    int updateStatus(@Param("id") Long id, @Param("status") String status);

    int deleteById(@Param("id") Long id);
    
    int updateStatusAndPhoto(
    	    @Param("id") Long id,
    	    @Param("status") String status,
    	    @Param("completedPhoto") String completedPhoto
    	);

}
