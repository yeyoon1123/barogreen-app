// src/Pages/ReportListPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAdminReports,
  typeLabel,
} from "../features/users/reports/useAdminReports";

export default function ReportListPage() {
  const navigate = useNavigate();

  // 자동 새로고침 관련 상태
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  // 관리자 신고 목록 훅에 넘길 파라미터 (필요하면 q/status 나중에 추가)
  const params = useMemo(
    () => ({
      q: "",
      status: "",
      page: 0,
      size: 50,
    }),
    []
  );

  const { items, total, loading, error, reload } = useAdminReports(params);

  // 수동 새로고침
  const onManualRefresh = () => {
    setLastUpdated(new Date());
    reload();
  };

  // 자동 갱신 타이머
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        setLastUpdated(new Date());
        reload();
      }, 10000); // 10초
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, reload]);

  return (
    <section className="table-wrap full-page">
      <div
        className="table-head"
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0, marginRight: "auto" }}>신고 관리</h3>

        <button onClick={onManualRefresh} style={btn}>
          새로고침
        </button>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          자동갱신(10초)
        </label>

        {lastUpdated && !loading && (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            최근 업데이트: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}

        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
          총 {total}건
        </span>
      </div>

      {loading && <div style={{ padding: 16 }}>신고 목록을 불러오는 중…</div>}
      {!!error && !loading && <div style={errBox}>{error}</div>}

      {!loading && (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 130 }}>신고내용</th>
              <th>주소</th>
              <th style={{ width: 160 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              items.map((r) => {
                const rid = r.id ?? r.reportId;
                return (
                  <tr key={rid}>
                    <td>{typeLabel(r.type)}</td>
                    <td>
                      <span
                        style={{
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                        title="상세 보기"
                        onClick={() => navigate(`/reports/${rid}`)}
                      >
                        {r.address || r.note || "(주소/메모 없음)"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

/* ───────── 상태 뱃지: 한글로만 노출 ───────── */
function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();

  const base = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    border: "1px solid transparent",
    fontSize: 12,
  };

  // 접수완료(new / pending)
  if (s === "pending" || s === "new") {
    return (
      <span
        style={{
          ...base,
          background: "#fff7ed",
          color: "#9a3412",
          borderColor: "#fdba74",
        }}
      >
        접수완료
      </span>
    );
  }

  // 진행중(in_progress)
  if (s === "in_progress") {
    return (
      <span
        style={{
          ...base,
          background: "#eff6ff",
          color: "#1d4ed8",
          borderColor: "#bfdbfe",
        }}
      >
        진행중
      </span>
    );
  }

  // 처리완료(done / completed)
  if (s === "done" || s === "completed") {
    return (
      <span
        style={{
          ...base,
          background: "#ecfdf5",
          color: "#047857",
          borderColor: "#a7f3d0",
        }}
      >
        처리완료
      </span>
    );
  }

  // 그 외(예상 밖 값) — 거의 안 쓰이겠지만 방어용
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

/* ───────── 스타일 ───────── */
const btn = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#3730a3",
  cursor: "pointer",
  marginRight: 6,
};

const errBox = {
  padding: 12,
  margin: 12,
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 8,
};
