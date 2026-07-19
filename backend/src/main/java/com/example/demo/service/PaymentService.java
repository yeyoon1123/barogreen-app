// src/main/java/com/example/demo/service/PaymentService.java
package com.example.demo.service;

import com.example.demo.mapper.PaymentMapper;
import com.example.demo.model.Payment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    private final PaymentMapper paymentMapper;

    public PaymentService(PaymentMapper paymentMapper) {
        this.paymentMapper = paymentMapper;
    }

    public void saveSuccess(String orderId, String itemName, int amount) {
        Payment p = new Payment();
        p.setOrderId(orderId);
        p.setItemName(itemName);
        p.setAmount(amount);
        p.setStatus("결제완료");
        paymentMapper.insert(p);
    }

    public List<Payment> findAll() {
        return paymentMapper.findAll();
    }
}
