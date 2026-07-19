// app/core/historyStore.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBus } from "../utils/bus";

const KEY_REPORTS = "BG_HISTORY_REPORTS"; // 신고
const KEY_DISPOSALS = "BG_HISTORY_DISPOSALS"; // 버리기

// ---------- 내부 유틸 ----------
async function readArray(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
async function writeArray(key, arr) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(arr || []));
  } catch {}
}

// 상태 정규화: "접수 완료"/"처리 완료" 같은 한글/대문자도 안전하게
function sanitizeStatus(v) {
  if (!v) return "pending";
  const s = String(v).toLowerCase().trim();
  if (s.includes("completed") || s.includes("처리")) return "completed";
  if (s.includes("pending") || s.includes("접수")) return "pending";
  return s; // 이미 'pending'|'completed' 형식일 수 있음
}

function pickPhoto(item) {
  return item?.photoUri || item?.image || item?.imageUrl || item?.completedPhoto || "";
}

// 저장 스키마 통일
function normalize(item = {}, fixedType = "report") {
  const idRaw = item.id || item.reportId || `temp-${Date.now()}`;
  const id = String(idRaw);
  return {
    // 식별자
    id,
    reportId: id,

    // 구분
    type: fixedType, // 'report' | 'disposal'

    // 상태/시간
    status: sanitizeStatus(item.status || "pending"),
    reportedAt: item.reportedAt || item.createdAt || item.time || new Date().toISOString(),
    completedAt: item.completedAt || item.completed_at || null,

    // 데이터
    address: item.address || item.addr || "주소 정보 없음",
    note: item.note || "",
    category: item.category || item.trashType || item.trashTypeLabel || "",
    photoUri: pickPhoto(item),
    completedPhoto: item.completedPhoto || null,

    // 원본 필드가 더 있을 수 있으니 그대로 보존
    ...item,
  };
}

// 리스트 앞쪽에 넣되, 같은 id는 덮어쓰기
function mergeUniqueFront(list, item) {
  const id = item.id || item.reportId;
  if (!id) return [item, ...list];
  const rest = list.filter(x => (x.id || x.reportId) !== id);
  return [item, ...rest];
}

// ---------- 외부 공개 API ----------

// ✅ 신고 추가
export async function historyAddReport(item) {
  const list = await readArray(KEY_REPORTS);
  const norm = normalize(item, "report");
  const next = mergeUniqueFront(list, norm);
  await writeArray(KEY_REPORTS, next);
  getBus().emit("HISTORY_UPDATED");
}

// ✅ 버리기 추가
export async function historyAddDisposal(item) {
  const list = await readArray(KEY_DISPOSALS);
  const norm = normalize(item, "disposal");
  const next = mergeUniqueFront(list, norm);
  await writeArray(KEY_DISPOSALS, next);
  getBus().emit("HISTORY_UPDATED");
}

// ✅ 신고 리스트
export async function historyListReports() {
  const arr = await readArray(KEY_REPORTS);
  return arr.sort((a, b) => new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0));
}

// ✅ 버리기 리스트
export async function historyListDisposals() {
  const arr = await readArray(KEY_DISPOSALS);
  return arr.sort((a, b) => new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0));
}

// ✅ (선택) 전체 초기화
export async function historyClearAll() {
  await writeArray(KEY_REPORTS, []);
  await writeArray(KEY_DISPOSALS, []);
  getBus().emit("HISTORY_UPDATED");
}

// ✅ 신고+버리기 모두 로드 (마이페이지에서 병합용)
export async function historyLoadAll() {
  try {
    const [reports, disposals] = await Promise.all([
      readArray(KEY_REPORTS),
      readArray(KEY_DISPOSALS),
    ]);
    return { reports, disposals };
  } catch {
    return { reports: [], disposals: [] };
  }
}
