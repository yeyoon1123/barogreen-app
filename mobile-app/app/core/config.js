
// // app/core/config.js
// import { Platform } from "react-native";
// import Constants from "expo-constants";

// /**
//  * 개발 중(Expo Go) 자동 추론:
//  * - Expo Dev Server의 hostUri에서 PC IP를 뽑아 씁니다.
//  * - hostUri가 없거나 엇갈리면 수동 HOTSPOT_IP로 fallback.
//  */
// function resolveHost() {
//   // 1) Expo가 알려주는 host (예: "192.168.137.1:8081")
//   const hostUri = Constants?.expoConfig?.hostUri ?? "";
//   const fromExpo = hostUri.split(":")[0];

//   // 2) 수동 지정 (핫스팟일 때 대부분 192.168.137.1)
//   const HOTSPOT_IP = "192.168.137.1"; // ← PC가 핫스팟 호스트일 때 폰에서 접근하는 주소

//   // 3) 에뮬레이터 특수 케이스(참고): 실제 기기에서는 절대 사용하지 않음
//   const ANDROID_EMULATOR = "10.0.2.2";

//   // 우선순위: Expo host IP → 수동 핫스팟 IP → (안드 에뮬레이터일 때만) 10.0.2.2
//   if (fromExpo && /^[0-9.]+$/.test(fromExpo)) return fromExpo;
//   if (HOTSPOT_IP) return HOTSPOT_IP;
//   if (Platform.OS === "android") return ANDROID_EMULATOR;
//   return "localhost";
// }

// export const PORT = 8080; // Spring Boot 포트
// export const HOST = resolveHost();
// export const API_BASE = `http://${HOST}:${PORT}`;   // 일반 로그인, CRUD API용

// // ✅ 카카오페이 등 외부 결제용 HTTPS 베이스
// export const PAY_BASE =
//   Constants?.expoConfig?.extra?.PAY_BASE || "https://pay.barogreen.site";

// // 자주 쓰는 엔드포인트
// export const API = {
//   login: `${API_BASE}/api/user/login`,
//   register: `${API_BASE}/api/user/register`,
//   sendCode: `${API_BASE}/api/email/send-code`,
//   verifyCode: `${API_BASE}/api/email/verify-code`,
//   // 필요 시 계속 추가
// };

// app/core/config.js
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * 개발 중(Expo Go / 에뮬레이터)에서 백엔드 호스트 추론:
 * 1) Expo Dev Server 의 hostUri 사용
 * 2) 안드로이드 에뮬레이터의 localhost → 10.0.2.2 치환
 * 3) 그래도 못 찾으면 수동 PC IP 로 fallback
 */
function resolveHost() {
  const hostUri = Constants?.expoConfig?.hostUri ?? "";
  const raw = hostUri.split(":")[0]; // 예: "192.168.0.10" 또는 "localhost"

  // 1) 안드로이드 에뮬레이터에서 hostUri 가 localhost 인 경우 → 10.0.2.2 로 치환
  if (
    Platform.OS === "android" &&
    (raw === "localhost" || raw === "127.0.0.1" || raw === "")
  ) {
    return "10.0.2.2";
  }

  // 2) Expo 가 실제 IP(192.168.x.x)를 알려준 경우 그걸 그대로 사용
  if (raw && /^[0-9.]+$/.test(raw)) {
    return raw;
  }

  // 3) 최후 수단: PC 의 IPv4 주소를 직접 적어두기
  //    (ipconfig 로 확인해서 그때그때 바꿔야 함)
  const MANUAL_PC_IP = "192.168.25.223";  // ← 이 부분을 본인 현재 IP 로 수정
  return MANUAL_PC_IP;
}

export const PORT = 8080; // Spring Boot 포트
export const HOST = resolveHost();
export const API_BASE = `http://${HOST}:${PORT}`; // 일반 로그인, CRUD API용

// ✅ 카카오페이 등 외부 결제용 HTTPS 베이스
export const PAY_BASE =
  Constants?.expoConfig?.extra?.PAY_BASE || "https://pay.barogreen.site";

// 자주 쓰는 엔드포인트
export const API = {
  login: `${API_BASE}/api/user/login`,
  register: `${API_BASE}/api/user/register`,
  sendCode: `${API_BASE}/api/email/send-code`,
  verifyCode: `${API_BASE}/api/email/verify-code`,
  // 필요 시 계속 추가
};
