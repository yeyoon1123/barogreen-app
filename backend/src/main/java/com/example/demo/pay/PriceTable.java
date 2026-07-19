package com.example.demo.pay;

public class PriceTable {
    // 기준가 (프론트 기본표와 동일)
    public static int rawPrice(String category) {
        if (category == null) return 0;
        return switch (category) {
            case "일반 쓰레기" -> 8000;
            case "재활용"     -> 6000;
            case "대형 폐기물" -> 15000;
            case "음식물"     -> 5000;
            case "기타"       -> 7000;
            default -> 7000;
        };
    }
    // 1/3로 낮춘 뒤 10% 할인
    public static int finalPrice(String category) {
        int base = rawPrice(category);
        int afterRate = Math.round(base / 3f);
        int discount = (afterRate > 0) ? (int)Math.floor(afterRate * 0.1) : 0;
        return Math.max(0, afterRate - discount);
    }
}
	