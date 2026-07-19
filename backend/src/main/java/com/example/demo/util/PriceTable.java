// src/main/java/com/example/demo/util/PriceTable.java
package com.example.demo.util;

import java.util.Map;

public class PriceTable {
    // 서버 권위 가격: 1/3로 인하, 100원 단위 반올림
    public static final Map<String, Integer> CATEGORY_PRICE = Map.of(
        "일반 쓰레기", 2700,
        "재활용", 2000,
        "대형 폐기물", 5000,
        "음식물", 1700,
        "기타", 2300
    );

    public static int getPrice(String category) {
        Integer v = CATEGORY_PRICE.getOrDefault(category, 2300);
        return Math.max(v, 0);
    }
}
