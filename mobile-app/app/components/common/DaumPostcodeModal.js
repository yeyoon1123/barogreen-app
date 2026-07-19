import React, { useMemo } from "react";
import { Modal, View, Text, Pressable, Platform } from "react-native";
import { WebView } from "react-native-webview";

export default function DaumPostcodeModal({
  visible,
  onClose,
  onSelected, // (data) => void
  title = "주소 검색",
}) {
  const html = useMemo(
    () => `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
  <style>html,body,#wrap{margin:0;padding:0;height:100%;width:100%;overflow:hidden;background:#fff}</style>
</head>
<body>
  <div id="wrap"></div>
  <script>
    (function(){
      // iOS 팝업 차단 대응: 새창을 같은 창으로 열기
      window.open = function(url){ if(url) location.href = url; return null; };

      function safePost(msg){
        try {
          setTimeout(function(){
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg));
          }, 0);
        } catch(e){}
      }

      function exec(){
        new daum.Postcode({
          oncomplete: function(data){ safePost({ ok:true, data }); },
          onclose:    function(state){ safePost({ ok:false, reason: state }); },
          width:'100%', height:'100%'
        }).embed(document.getElementById('wrap'), { autoClose:false });
      }

      // viewport/meta는 head에 이미 있음
      // 스크립트 동적 로드 후 실행
      var s = document.createElement('script');
      s.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      s.onload = exec;
      document.body.appendChild(s);
    })();
  </script>
</body>
</html>`,
    [],
  );

  const handleMessage = event => {
    try {
      const msg = JSON.parse(event?.nativeEvent?.data || "{}");
      if (msg?.ok && msg?.data) {
        onSelected?.(msg.data);
        onClose?.();
      } else {
        onClose?.();
      }
    } catch {
      onClose?.();
    }
  };

  // 필수 도메인 화이트리스트 (iOS 내비게이션 차단 완화)
  const allow = (url = "") =>
    url.startsWith("about:blank") ||
    url.startsWith("data:") ||
    url.startsWith("https://t1.daumcdn.net") || // 우편번호 번들
    url.startsWith("https://postcode.map.daum.net") ||
    url.startsWith("https://ssl.daumcdn.net") ||
    url.startsWith("https://i1.daumcdn.net");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
      onRequestClose={onClose}
    >
      {/* 헤더 */}
      <View
        style={{
          paddingTop: Platform.OS === "ios" ? 14 : 8,
          paddingHorizontal: 16,
          paddingBottom: 8,
          backgroundColor: "#0C5E35",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={{ color: "white", fontSize: 15 }}>닫기</Text>
        </Pressable>
      </View>

      {/* 본문 WebView */}
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://postcode.map.daum.net" }}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false} // iOS에선 무의미하지만 명시
        onMessage={handleMessage}
        mixedContentMode="always"
        startInLoadingState
        onShouldStartLoadWithRequest={req => {
          // 필수 리소스/내부 이동은 허용, 그 외는 기본 허용(팝업은 window.open override로 same-window 처리)
          return allow(req?.url || "");
        }}
      />
    </Modal>
  );
}
