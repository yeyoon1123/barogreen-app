package com.example.demo.util;

import java.util.HashMap;
import java.util.Map;

public class CodeStore {
    private static final Map<String, String> codeMap = new HashMap<>();

    public static void saveCode(String email, String code) {
        codeMap.put(email.toLowerCase(), code);  // ✅ 소문자로 저장
    }

    public static boolean verifyCode(String email, String code) {
        return code.equals(codeMap.get(email.toLowerCase()));  // ✅ 소문자로 조회
    }

    public static void removeCode(String email) {
        codeMap.remove(email.toLowerCase());  // ✅ 소문자로 삭제
    }
}
