// src/main/java/com/example/demo/pay/KakaoPayService.java
package com.example.demo.pay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class KakaoPayService {

    // DEV 비밀키 (test_sk_...)
    @Value("${kakao.pay.secret}")
    private String secretKey;

    // 테스트 CID
    @Value("${kakao.pay.cid:TC0ONETIME}")
    private String cid;

    // OpenAPI 호스트
    @Value("${kakao.pay.host:https://open-api.kakaopay.com}")
    private String kakaoHost;

    // 승인/취소/실패 콜백 베이스 (예: https://pay.barogreen.site/api/pay/kakao)
    @Value("${kakao.pay.return-base}")
    private String returnBase;

    // 앱 딥링크 스킴 (예: barogreen) — DevClient/배포앱에서만 사용
    @Value("${kakao.pay.app-scheme:barogreen}")
    private String appScheme;

    private final RestTemplate rest = new RestTemplate();

    // orderId -> tid
    private final Map<String, String> orderTidStore = new ConcurrentHashMap<>();

    public static class ReadyResult {
        public String tid;
        public String redirectUrl;
        public int amount;
    }

    public static class ApproveResult {
        public String aid;
        public String tid;
        public String orderId;
        public int amount;
        public String itemName;
    }

    private HttpHeaders kakaoHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        // OpenAPI는 SECRET_KEY 스킴
        h.set("Authorization", "SECRET_KEY " + secretKey);
        return h;
    }

    /** 결제 준비 */
    public ReadyResult ready(String orderId,
                             String itemName,
                             int finalAmount,
                             Map<String, Object> metadata) {

        int totalAmount = Math.max(0, finalAmount);

        String apiBase = kakaoHost + "/online/v1/payment";

        String approvalUrl = returnBase + "/return?orderId=" + url(orderId);
        String cancelUrl   = returnBase + "/cancel?orderId=" + url(orderId);
        String failUrl     = returnBase + "/fail?orderId=" + url(orderId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid", cid);
        body.put("partner_order_id", orderId);
        body.put("partner_user_id", "guest");
        body.put("item_name", itemName != null ? itemName : "수거 대행");
        body.put("quantity", 1);
        body.put("total_amount", totalAmount);
        body.put("tax_free_amount", 0);

        body.put("approval_url", approvalUrl);
        body.put("cancel_url", cancelUrl);
        body.put("fail_url", failUrl);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, kakaoHeaders());

        try {
            ResponseEntity<Map> resp = rest.postForEntity(apiBase + "/ready", req, Map.class);

            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new RuntimeException("Kakao Ready 실패: " + resp.getStatusCode());
            }

            String tid        = String.valueOf(resp.getBody().get("tid"));
            String nextMobile = String.valueOf(resp.getBody().get("next_redirect_mobile_url"));
            String nextPc     = String.valueOf(resp.getBody().get("next_redirect_pc_url"));
            if (tid == null || "null".equals(tid)) {
                throw new RuntimeException("Kakao Ready 응답에 tid 없음");
            }

            orderTidStore.put(orderId, tid);

            ReadyResult out = new ReadyResult();
            out.tid = tid;
            out.redirectUrl = (nextMobile != null && !"null".equals(nextMobile)) ? nextMobile : nextPc;
            out.amount = totalAmount;
            return out;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("[KakaoPay Ready ERROR] " + e.getStatusCode() + " " + e.getStatusText());
            System.err.println("[Body] " + e.getResponseBodyAsString());
            throw e;
        }
    }

    /** 승인 */
    public ApproveResult approve(String orderId, String pgToken) {
        String tid = orderTidStore.get(orderId);
        if (tid == null) throw new RuntimeException("tid not found for orderId=" + orderId);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("cid", cid);
        body.put("tid", tid);
        body.put("partner_order_id", orderId);
        body.put("partner_user_id", "guest");
        body.put("pg_token", pgToken);

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, kakaoHeaders());

        String base = kakaoHost + "/online/v1/payment";
        try {
            ResponseEntity<Map> resp = rest.postForEntity(base + "/approve", req, Map.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new RuntimeException("Kakao Approve 실패: " + resp.getStatusCode());
            }

            Map respBody = resp.getBody();

            ApproveResult out = new ApproveResult();
            out.tid = tid;
            out.orderId = orderId;
            out.aid = str(respBody.get("aid"));
            out.itemName = str(respBody.get("item_name"));

            Map amount = (Map) respBody.get("amount");
            out.amount = amount != null ? num(amount.get("total")) : 0;

            orderTidStore.remove(orderId);
            return out;
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("[KakaoPay Approve ERROR] " + e.getStatusCode() + " " + e.getStatusText());
            System.err.println("[Body] " + e.getResponseBodyAsString());
            throw e;
        }
    }

    /** 앱 딥링크 (DevClient/배포앱에서 onLinking으로 수신) */
    public String buildAppDeepLink(String status, String orderId, String tid, String pgToken) {
        String base = appScheme + "://pay/kakao/complete";
        StringBuilder sb = new StringBuilder(base).append("?status=").append(url(status))
                .append("&orderId=").append(url(orderId));
        if (tid != null) sb.append("&tid=").append(url(tid));
        if (pgToken != null) sb.append("&pg_token=").append(url(pgToken));
        return sb.toString();
    }

    private static String url(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }

    private static int num(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception e) {
            return 0;
        }
    }
}
