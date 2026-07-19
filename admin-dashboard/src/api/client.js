// src/api/client.js
import axios from "axios";

/**
 * REACT_APP_API_BASE 예시
 * - http://localhost:8080
 * - http://localhost:8080/api
 * - https://your-domain.com
 * 무엇을 넣든 BASE_URL이 최종적으로 ".../api"가 되도록 보정합니다.
 */
const RAW = (process.env.REACT_APP_API_BASE || "").trim() || "http://localhost:8080";

// 🔧 baseURL에 /api 보장
const BASE_URL = RAW.endsWith("/api") ? RAW : `${RAW.replace(/\/+$/, "")}/api`;

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// 공통 에러 메시지 헬퍼
export function getErrMsg(err, fallback = "요청 실패") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

// 기본 인스턴스 + 호환용 named export(api)
export default client;
export { client as api };
