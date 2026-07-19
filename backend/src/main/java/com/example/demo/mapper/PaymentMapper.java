// src/main/java/com/example/demo/mapper/PaymentMapper.java
package com.example.demo.mapper;

import com.example.demo.model.Payment;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PaymentMapper {
    void insert(Payment payment);
    List<Payment> findAll();
}
