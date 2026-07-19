package com.example.demo.mapper;

import com.example.demo.model.CorrectionRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CorrectionRequestMapper {

    void insert(CorrectionRequest req);

    List<CorrectionRequest> findAll();  // 관리자 페이지 목록

    int updateStatus(@Param("id") Long id,
                     @Param("status") String status);

    int markResolvedByReportId(@Param("reportId") Long reportId);
}
