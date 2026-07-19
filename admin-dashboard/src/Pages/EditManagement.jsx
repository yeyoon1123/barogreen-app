// admin/src/pages/EditManagement.jsx

// 백엔드 베이스 URL (필요하면 192.168.x.x 로 바꿔도 됨)
const API_BASE = "http://localhost:8080";

import React, { useState, useEffect } from "react";

// --- 신고자 라벨 유틸 (guest → 비회원, 나머지는 그대로 이메일/ID)
const getReporterLabel = req => {
  const raw = (req.reporterId || "").toString().trim();
  if (!raw || raw.toLowerCase() === "guest") return "비회원";
  return raw;
};

// --- URL 정규화 (상대경로면 백엔드 주소 붙이기) ---
// 백엔드 베이스 URL (필요하면 192.168.x.x 로 바꿔도 됨)
const API_ORIGIN = API_BASE.replace(/\/+$/, "");

// --- URL 정규화 (상대경로/localhost/윈도우 경로 보정) ---
const normalizeUrl = src => {
  if (!src) return "";
  let s = String(src).trim();

  // 윈도우 경로일 수 있으니 역슬래시를 슬래시로
  s = s.replace(/\\/g, "/");

  // 절대 URL 인 경우
  if (s.startsWith("http://") || s.startsWith("https://")) {
    // localhost → API_ORIGIN 으로 치환
    if (s.includes("://localhost") || s.includes("://127.0.0.1")) {
      const path = s.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "");
      return `${API_ORIGIN}${path}`;
    }
    return s;
  }

  // /uploads/... 형태
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
};


// --- 정정 요청 사유 파싱 유틸 ---
// "[기타] 블라블라" → { reasonCategory: "기타", reasonBody: "블라블라" }
const parseReason = raw => {
  const text = (raw || "").trim();
  if (!text) return { reasonCategory: null, reasonBody: "" };

  const m = text.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (m) {
    return {
      reasonCategory: m[1],
      reasonBody: m[2] || "",
    };
  }
  // 대괄호가 아예 없는 경우 전체를 본문으로
  return { reasonCategory: null, reasonBody: text };
};
// --- 컴포넌트 ---
export default function EditManagement() {
  const [requests, setRequests] = useState([]);     // 정정 요청 목록
  const [reportMap, setReportMap] = useState({});   // reportId → Report(사진 포함)
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // 특정 요청들에 대한 신고 상세(사진) 한번에 가져오기
  const loadReportsForRequests = async list => {
    const ids = Array.from(
      new Set(
        (list || [])
          .map(r => r.reportId)
          .filter(id => id !== null && id !== undefined)
      )
    );

    if (ids.length === 0) {
      setReportMap({});
      return;
    }

    try {
      const entries = await Promise.all(
        ids.map(async id => {
          try {
            const res = await fetch(`${API_BASE}/api/trash/${id}`);
            if (!res.ok) throw new Error("report load fail");
            const report = await res.json();
            return [id, report];
          } catch (e) {
            console.error("신고 상세 로드 실패:", id, e);
            return [id, null];
          }
        })
      );

      const nextMap = {};
      for (const [id, rep] of entries) {
        if (rep) nextMap[id] = rep;
      }
      setReportMap(nextMap);
    } catch (e) {
      console.error("loadReportsForRequests 에러:", e);
    }
  };

  // 메인 로딩용: 로딩 플래그 켜고 한 번 전체 로드
  const fetchRequests = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/correction-requests`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRequests(data || []);
      await loadReportsForRequests(data || []);
    } catch (e) {
      console.error("데이터 로드 오류:", e);
      setMessage({ type: "error", text: "데이터를 불러오는 데 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  // 🔄 깜빡임 없는 조용한 새로고침
  async function refreshRequestsSilent() {
    try {
      const response = await fetch(`${API_BASE}/api/correction-requests`);
      if (!response.ok) return; // 조용히 무시
      const data = await response.json();
      setRequests(data || []);
      await loadReportsForRequests(data || []);
    } catch (e) {
      console.error("silent refresh error:", e);
    }
  }

  // ⭕ 최초 1회 + 이후 5초마다 조용히 새로고침
  useEffect(() => {
    fetchRequests(); // 페이지 진입 시 1회

    const timer = setInterval(() => {
      refreshRequestsSilent();
    }, 5000); // 5초 간격

    return () => clearInterval(timer);
  }, []);

  // --- 상태 업데이트 핸들러 (필요 시 승인/반려에 사용) ---
  const handleUpdateRequestStatus = async (id, newStatus) => {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/correction-requests/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("상태 업데이트 실패");
      }

      setMessage({
        type: "success",
        text: `요청이 ${newStatus === "APPROVED" ? "승인" : "반려"}되었습니다.`,
      });

      // 서버 기준으로 다시 싹 로드
      fetchRequests();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("업데이트 오류:", error);
      setMessage({ type: "error", text: "상태 업데이트에 실패했습니다." });
    }
  };


  return (
    <div className="table-wrap full-page" style={{ padding: "20px" }}>
      <h3 style={{ marginTop: 0 }}>정정 요청 관리</h3>

      {message && (
        <div style={message.type === "success" ? successBox : errBox}>
          {message.text}
        </div>
      )}

      {loading && <div style={{ padding: 16 }}>요청 목록을 불러오는 중…</div>}

      {!loading && (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>신고 ID</th>
              <th style={{ width: 140 }}>신고자</th>
              <th>요청 사유</th>
              <th style={{ width: 150 }}>요청 시간</th>
              <th style={{ width: 120 }}>상태</th>
              <th style={{ width: 180 }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  접수된 정정 요청이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map(req => {
                const reporterLabel = getReporterLabel(req);
  const report = reportMap[req.reportId] || {};

  const isDeleted = (req.status || "").toUpperCase() === "DELETED";

  // 🔍 사유 파싱
  const { reasonCategory, reasonBody } = parseReason(req.reason);

  return (
    <tr key={req.id}>
      <td>{req.reportId || "-"}</td>
      <td>{reporterLabel}</td>

      {/* 요청 사유 표시 */}
      <td>
        {reasonCategory && (
          <div style={{ marginBottom: 4, fontWeight: 700 }}>
            [{reasonCategory}]
          </div>
        )}
        {reasonBody ? (
          <div>사유 : {reasonBody}</div>
        ) : !reasonCategory ? (
          "-"
        ) : null}
      </td>

      <td>
        {req.createdAt
          ? new Date(req.createdAt).toLocaleString()
          : "-"}
      </td>
      <td>
        <StatusBadge status={req.status} />
      </td>
      <td>
        {!isDeleted && (
          <button
            style={btnReject}
            onClick={async () => {
              const reason = window.prompt(
                "삭제 사유를 입력하세요.\n(예: 허위 신고, 중복 신고 등)"
              );
              if (!reason) return;

              try {
                const resp = await fetch(
                  `${API_BASE}/api/reports/${req.reportId}/delete-with-reason`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                  }
                );

                if (!resp.ok) throw new Error("삭제 실패");

                setMessage({
                  type: "success",
                  text: "신고가 삭제되고 사용자에게 알림이 전송되었습니다.",
                });

                setRequests(prev =>
                  prev.map(r =>
                    r.id === req.id ? { ...r, status: "DELETED" } : r
                  )
                );

                setTimeout(() => setMessage(null), 2000);
              } catch (e) {
                console.error("delete-with-reason error:", e);
                setMessage({
                  type: "error",
                  text: "삭제 처리 중 오류가 발생했습니다.",
                });
              }
            }}
          >
            신고 삭제
          </button>
        )}
      </td>
    </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// --- 상태 배지 컴포넌트 ---
function StatusBadge({ status }) {
  const s = (status || "").toUpperCase();
  const base = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    border: "1px solid transparent",
    fontSize: 12,
  };

  if (s === "PENDING")
    return (
      <span
        style={{
          ...base,
          background: "#fffbeb",
          color: "#b45309",
          borderColor: "#fde68a",
        }}
      >
        접수 완료
      </span>
    );
  if (s === "APPROVED")
    return (
      <span
        style={{
          ...base,
          background: "#ecfdf5",
          color: "#047857",
          borderColor: "#a7f3d0",
        }}
      >
        처리 완료
      </span>
    );
  if (s === "REJECTED")
    return (
      <span
        style={{
          ...base,
          background: "#fef2f2",
          color: "#991b1b",
          borderColor: "#fecaca",
        }}
      >
        반려됨
      </span>
    );
  if (s === "DELETED")
    return (
      <span
        style={{
          ...base,
          background: "#f3f4f6",
          color: "#111827",
          borderColor: "#d1d5db",
        }}
      >
        삭제됨
      </span>
    );

  return (
    <span
      style={{
        ...base,
        background: "#f3f4f6",
        color: "#374151",
        borderColor: "#e5e7eb",
      }}
    >
      {s || "알 수 없음"}
    </span>
  );
}

// --- 스타일 ---
const btn = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid",
  cursor: "pointer",
  marginRight: 6,
  fontWeight: 600,
  fontSize: 14,
};

const btnReject = {
  ...btn,
  background: "#fef2f2",
  color: "#991b1b",
  borderColor: "#fecaca",
};

const errBox = {
  padding: 12,
  margin: "0 0 16px 0",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 8,
  fontSize: "14px",
};

const successBox = {
  ...errBox,
  background: "#f0fdf4",
  color: "#15803d",
};
