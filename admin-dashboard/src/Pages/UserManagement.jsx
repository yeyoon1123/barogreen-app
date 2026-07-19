// src/Pages/UserManagement.jsx
import React, { useState } from "react";
import { useAdminUsers } from "../features/users/useAdminUsers";

export default function UserManagement() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { items, loading, error, update, remove } = useAdminUsers(q, status, 0, 50);

  return (
    <div style={wrap}>
      <h2 style={{ marginBottom: 12 }}>사용자 관리</h2>

      <div style={toolbar}>
        <input placeholder="검색 (이름/이메일)" value={q} onChange={(e) => setQ(e.target.value)} style={input} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={select}>
          <option value="">모든 사용자</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
        </select>
      </div>

      {loading && <div style={{ padding: 12 }}>불러오는 중...</div>}
      {!!error && <div style={errorBox}>{error}</div>}

      {!loading && !error && (
        <table style={table}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>이름</th>
              <th style={th}>이메일</th>
              <th style={th}>상태</th>
              <th style={th}>가입일</th>
              <th style={th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>데이터가 없습니다.</td>
              </tr>
            )}
            {items.map((u) => (
              <tr key={u.email}>
                <td style={td}>{u.name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 12, color: "#fff", background: u.status === "ACTIVE" ? "#16a34a" : "#dc2626" }}>
                    {u.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </td>
                <td style={td}>{u.joinedAt ? new Date(u.joinedAt).toISOString().slice(0, 10) : "-"}</td>
                <td style={{ ...td, display: "flex", gap: 8 }}>
                  <button style={btn} onClick={() => update(u.email, { status: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}>
                    {u.status === "ACTIVE" ? "비활성" : "활성"}
                  </button>
                  <button style={{ ...btn, background: "#fee2e2", color: "#dc2626" }} onClick={() => { if (window.confirm("정말 삭제하시겠습니까?")) remove(u.email); }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const wrap = { padding: 16, maxWidth: 1100, margin: "0 auto" };
const toolbar = { display: "flex", gap: 8, margin: "12px 0 16px" };
const input = { flex: 1, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 };
const select = { padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 };
const errorBox = { padding: 12, marginBottom: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8 };
const table = { width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" };
const theadRow = { background: "#f8fafc" };
const th = { textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb" };
const td = { padding: 12, borderBottom: "1px solid #e5e7eb", verticalAlign: "middle" };
const btn = { padding: "8px 12px", background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer" };
