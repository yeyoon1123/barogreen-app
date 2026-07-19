// src/Pages/CommunityList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts } from "../api/community";
import { getErrMsg } from "../api/client";

export default function CommunityList() {
  const [q, setQ] = useState("");
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = useMemo(
    () => ({
      q,
      hidden: onlyHidden ? true : undefined,
      page: 0,
      size: 50,
    }),
    [q, onlyHidden]
  );

  const load = async () => {
    setLoading(true);
    try {
      // ✅ 공통 API 유틸 사용 (axios + /api/admin/posts or /api/posts)
      const { items, total } = await fetchPosts(params);
      setItems(items);
      setTotal(total);
      setError("");
    } catch (e) {
      console.error("게시글 목록 로드 오류:", e);
      setError(getErrMsg(e, "게시글 목록을 불러오는 데 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  // 처음 한 번 로드
  useEffect(() => {
    load();
    // 검색어/숨김 여부가 바뀔 때마다 자동 로드하고 싶으면 아래 주석 해제
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card full-page">
      <h3 style={{ marginBottom: 10 }}>커뮤니티 게시글</h3>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="제목/작성자/본문 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={input}
        />
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <input
            type="checkbox"
            checked={onlyHidden}
            onChange={(e) => setOnlyHidden(e.target.checked)}
          />
          숨김만 보기
        </label>
        {/* 검색 버튼이 load 호출 */}
        <button onClick={load} style={btn}>
          검색
        </button>
        <div style={{ marginLeft: "auto", color: "#6b7280" }}>총 {total}건</div>
      </div>

      {!!error && <div style={err}>{error}</div>}

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 80 }}>ID</th>
            <th>제목</th>
            <th style={{ width: 180 }}>작성자</th>
            <th style={{ width: 160 }}>작성일</th>
            <th style={{ width: 100 }}>상태</th>
            <th style={{ width: 140 }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="6" className="empty">
                불러오는 중…
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan="6" className="empty">
                데이터가 없습니다.
              </td>
            </tr>
          )}
          {!loading &&
            items.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <Link to={`/community/${p.id}`}>
                    {p.title || "(제목 없음)"}
                  </Link>
                </td>
                <td>{p.authorName || p.author || "-"}</td>
                <td>
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}
                </td>
                <td>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "#fff",
                      background: p.hidden ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {p.hidden ? "숨김" : "노출"}
                  </span>
                </td>
                <td>
                  <Link to={`/community/${p.id}`} style={linkBtn}>
                    보기/관리
                  </Link>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  padding: 10,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  flex: 1,
  minWidth: 260,
};
const btn = {
  padding: "8px 12px",
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#3730a3",
  borderRadius: 8,
  cursor: "pointer",
};
const linkBtn = {
  padding: "6px 10px",
  border: "1px solid #c7d2fe",
  borderRadius: 8,
  textDecoration: "none",
  color: "#3730a3",
  background: "#eef2ff",
};
const err = {
  padding: 12,
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 8,
  marginBottom: 12,
};
