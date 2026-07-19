// app/core/reportCache.js
import { getBus } from "../utils/bus";

let _flags = [];

/** id로 캐시에서 신고 찾기 */
export function findReportById(id) {
  if (!id) return null;
  const key = String(id);
  return (
    _flags.find(r => {
      const rid = r.reportId ?? r.id ?? r.report_id ?? r._id;
      return String(rid) === key;
    }) || null
  );
}

/** 서버에서 온 원본 Report → 앱 공통 포맷으로 정규화 */
function normalize(r = {}) {
  const status = String(r.status || "").toLowerCase();
  const category = r.category || r.trashType || r.trashTypeLabel || "";
  const photo =
    r.photoUri ||
    r.photo_url ||
    r.photo ||
    r.imageUrl ||
    r.image_url ||
    r.image ||
    r.completedPhoto ||
    "";

  const item = {
    id: r.reportId ?? r.id ?? r.report_id ?? r._id ?? `temp-${Math.random()}`,
    reportId: r.reportId ?? r.id ?? r.report_id ?? r._id,
    lat: Number(r.lat ?? r.latitude),
    lng: Number(r.lng ?? r.longitude),
    address: r.address || r.addr || "주소 정보 없음",
    note: r.note || "",
    status, // pending | processing | completed
    category,
    type: (r.type || r.trashType || "").toString().toLowerCase() || "report",
    reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || null,
    completedAt: r.completedAt || r.completed_at || null,
    photo,
    raw: r, // 🔹 원본 그대로 보관 (reporterId 등 소유자 정보 포함)
  };

  // note가 "[카테고리]" 패턴이면 disposal로 간주(백엔드 없이 구분)
  if (item.type === "report" && typeof item.note === "string" && /^\[.+?\]/.test(item.note)) {
    item.type = "disposal";
  }
  return item;
}

/** 전체 플래그 캐시 세팅 */
export function setAllFlags(arr) {
  _flags = Array.isArray(arr) ? arr.map(normalize) : [];
  try {
    getBus().emit("REPORTS_UPDATED");
  } catch {}
}

/** 전체(정규화된) 배열 반환 */
export function getAllFlags() {
  return _flags.slice();
}

/* ----------------------------------------
 * 소유자(owner) 추출 & 마이페이지용 필터
 * ------------------------------------- */

// 원본 Report에서 신고자 정보 문자열로 뽑기
function getOwner(raw = {}) {
  return (
    raw.reporterId ||
    raw.memberLoginId ||
    raw.memberNickname ||
    raw.userId ||
    raw.owner ||
    ""
  )
    .toString()
    .trim()
    .toLowerCase();
}

/**
 * 이 항목을 현재 사용자에게 보여줄지 여부
 * - reporterId: 로그인한 이메일/아이디 (없으면 "")
 * - guest: 비회원 여부
 *
 * ⚠ 회사/관리자 화면 같이 "필터 없이 전부 보고 싶은" 경우:
 *    getSplitByType() 처럼 reporterId/guest 둘 다 안 넘기면 전체 노출.
 */
function shouldIncludeForUser(item, reporterId, guest) {
  const raw = item.raw || {};
  const owner = getOwner(raw);
  const me = (reporterId || "").toString().trim().toLowerCase();

  // 1) reporterId, guest 둘 다 세팅 안 된 경우 → 필터 X (회사 / 관리자 등)
  if (!me && !guest) return true;

  // 2) 비회원(게스트)인 경우
  if (guest) {
    // owner가 비어 있거나 guest 로 저장된 건 게스트 화면에서만 보이게
    if (!owner) return true;
    if (owner === "guest") return true;
    // 다른 계정의 신고는 숨김
    return false;
  }

  // 3) 회원인 경우: 내 아이디와 정확히 일치하는 것만
  if (!me) return false; // 이론상 여기 안 오긴 하지만 방어 코드
  return owner === me;
}

/* ----------------------------------------
 * 타입(신고/버리기) + 사용자 기준으로 분리
 *
 * 사용 예)
 *  - 회사/관리자(전체):       getSplitByType()
 *  - 회원 마이페이지:         getSplitByType({ reporterId: loginId, guest: false })
 *  - 비회원(게스트) 마이페이지: getSplitByType({ guest: true })
 * ------------------------------------- */

/**
 * getSplitByType
 *
 * ① 기존 시그니처 유지:
 *      getSplitByType({ guest })
 *      getSplitByType({ guest, reporterId })
 *
 * ② 호환용(혹시 과거 코드가 있을 경우):
 *      getSplitByType(reporterId, isGuest)
 */
export function getSplitByType(arg, maybeGuest) {
  let guest = false;
  let reporterId = "";

  // 객체 인자 버전: { guest, reporterId }
  if (arg && typeof arg === "object" && !Array.isArray(arg)) {
    guest = !!arg.guest;
    reporterId = arg.reporterId || "";
  } else if (typeof arg === "string") {
    // 호환용: getSplitByType("email@...", true/false)
    reporterId = arg;
    guest = !!maybeGuest;
  } else if (typeof arg === "boolean") {
    // 호환용: getSplitByType(true)
    guest = arg;
  }

  const all = getAllFlags();

  // 🔹 현재 사용자 기준으로 필터
  const filtered = all.filter(it => shouldIncludeForUser(it, reporterId, guest));

  const disposalsOnly = filtered.filter(it => it.type === "disposal");
  const reportsOnly = filtered.filter(it => it.type !== "disposal");

  // 게스트는 버리기 내역(disposal)을 안 보여주던 기존 동작 유지
  if (guest && !reporterId) {
    return { reportsOnly, disposalsOnly: [] };
  }

  return { reportsOnly, disposalsOnly };
}
