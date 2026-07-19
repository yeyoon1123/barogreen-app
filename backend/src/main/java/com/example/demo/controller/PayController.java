// src/main/java/com/example/demo/controller/PayController.java
package com.example.demo.controller;

import com.example.demo.pay.KakaoPayService;
import com.example.demo.service.PaymentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api/pay/kakao")
public class PayController {

    private final KakaoPayService kakao;
    private final PaymentService paymentService;

    public PayController(KakaoPayService kakao, PaymentService paymentService) {
        this.kakao = kakao;
        this.paymentService = paymentService;
    }

    // ===== 결제 준비 =====
    @PostMapping("/ready")
    public ResponseEntity<?> ready(@RequestBody ReadyStart body) {
        try {
            String orderId = body.orderId != null ? body.orderId : "ORDER-" + System.currentTimeMillis();
            String itemName = body.itemName != null ? body.itemName : "수거 대행";
            int quantity = Math.max(1, body.quantity);
            String category = body.metadata != null
                    ? String.valueOf(body.metadata.getOrDefault("category", ""))
                    : "";

            int clientAmount = body.amount != null ? body.amount : 0;
            if (clientAmount <= 0) {
                clientAmount = com.example.demo.util.PriceTable.getPrice(category);
            }
            int finalAmount = clientAmount;

            KakaoPayService.ReadyResult rr = kakao.ready(
                    orderId,
                    itemName,
                    finalAmount,
                    body.metadata
            );

            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "orderId", orderId,
                    "amount", finalAmount,
                    "tid", rr.tid,
                    "redirectUrl", rr.redirectUrl
            ));
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String bodyText = e.getResponseBodyAsString();
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                    "ok", false,
                    "code", e.getStatusCode().value(),
                    "reason", e.getStatusText(),
                    "message", bodyText != null && !bodyText.isBlank() ? bodyText : "카카오 응답 오류"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "ok", false,
                    "code", 500,
                    "reason", "Internal Server Error",
                    "message", String.valueOf(e.getMessage())
            ));
        }
    }

    // ===== 승인 콜백 (approval_url) =====
    @GetMapping(value = "/return", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> approveReturn(
            @RequestParam("pg_token") String pgToken,
            @RequestParam("orderId") String orderId
    ) {
        try {
            KakaoPayService.ApproveResult ar = kakao.approve(orderId, pgToken);

            // ✅ 결제 성공 기록 (DB 저장)
            paymentService.saveSuccess(ar.orderId, ar.itemName, ar.amount);

            String deepLink = kakao.buildAppDeepLink("success", orderId, ar.tid, pgToken);
            String payloadJson = """
                {"type":"kakao-result","provider":"kakao","status":"success",
                 "orderId":"%s","tid":"%s","pg_token":"%s"}
                """.formatted(jsonEscape(orderId), jsonEscape(ar.tid), jsonEscape(pgToken));

            String html = autoCloseHtml(deepLink, "결제가 완료되었습니다.", payloadJson);
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);

        } catch (Exception e) {
            String deepLink = kakao.buildAppDeepLink("fail", orderId, null, null);
            String payloadJson = """
                {"type":"kakao-result","provider":"kakao","status":"fail","orderId":"%s"}
                """.formatted(jsonEscape(orderId));

            String html = autoCloseHtml(deepLink, "결제 승인에 실패했습니다.", payloadJson);
            return ResponseEntity.status(500).contentType(MediaType.TEXT_HTML).body(html);
        }
    }

    @GetMapping(value = "/cancel", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> cancel(@RequestParam("orderId") String orderId) {
        String deep = kakao.buildAppDeepLink("cancel", orderId, null, null);
        String payloadJson = """
            {"type":"kakao-result","provider":"kakao","status":"cancel","orderId":"%s"}
            """.formatted(jsonEscape(orderId));
        return ResponseEntity.ok(autoCloseHtml(deep, "결제가 취소되었습니다.", payloadJson));
    }

    @GetMapping(value = "/fail", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> fail(@RequestParam("orderId") String orderId) {
        String deep = kakao.buildAppDeepLink("fail", orderId, null, null);
        String payloadJson = """
            {"type":"kakao-result","provider":"kakao","status":"fail","orderId":"%s"}
            """.formatted(jsonEscape(orderId));
        return ResponseEntity.ok(autoCloseHtml(deep, "결제에 실패했습니다.", payloadJson));
    }

    // ✅ RN에서 결제 내역 조회
    @GetMapping("/history")
    public ResponseEntity<?> history() {
        return ResponseEntity.ok(paymentService.findAll());
    }

    // ===== 아래 유틸/내부 클래스는 기존 그대로 =====

    private static String autoCloseHtml(String deeplink, String msg, String statusJson) {
        String esc = htmlEscape(msg);
        return """
            <!doctype html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>KakaoPay</title>
              <style>
                body {
                    font-family: system-ui, -apple-system, Segoe UI, Roboto, Apple SD Gothic Neo, sans-serif;
                    padding: 24px;
                    text-align: center;
                }
                a.btn {
                    display: inline-block;
                    padding: 12px 16px;
                    border: 1px solid #777;
                    border-radius: 8px;
                    text-decoration: none;
                }
              </style>
            </head>
            <body>
              <h3>%s</h3>
              <p>앱으로 돌아갑니다…</p>
              <p><a id="manual" class="btn" href="%s">수동으로 이동</a></p>
              <script>
                (function(){
                  var payload = %s;

                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      try {
                          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
                      } catch(e){}
                      setTimeout(function(){ try{ window.close(); }catch(e){} }, 200);
                  } else {
                      var url = %s;
                      setTimeout(function(){ try { window.location.replace(url); } catch(e){} }, 50);
                  }
                })();
              </script>
            </body>
            </html>
            """.formatted(esc, deeplink, jsString(statusJson), jsString(deeplink));
    }

    private static String autoCloseHtml(String deeplink, String msg) {
        String payload = """
            {"type":"kakao-result","provider":"kakao","status":"unknown"}
            """;
        return autoCloseHtml(deeplink, msg, payload);
    }

    private static String htmlEscape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String jsString(String s) {
        if (s == null) return "''";
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }

    private static String jsonEscape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    public static class ReadyStart {
        public String orderId;
        public String itemName;
        public int quantity = 1;
        public Integer amount;
        public Map<String, Object> metadata;
    }
}
