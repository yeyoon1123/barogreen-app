// src/Pages/CommunityDetail.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deletePost,
  fetchComments,
  fetchPost,
  updatePost,
  deleteComment,
} from "../api/community";

// getErrMsg가 없거나 함수가 아닐 때도 안전하게 처리
import * as client from "../api/client";
const safeErr = (e, fb) =>
  (typeof client.getErrMsg === "function"
    ? client.getErrMsg(e, fb)
    : e?.message || fb || "요청 실패");

export default function CommunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;

    const run = async () => {
      setLoading(true);
      try {
        const p = await fetchPost(id);
        if (!ignore) setPost(p);

        try {
          const cs = await fetchComments(id, { size: 50 });
          if (!ignore) setComments(cs);
        } catch {
          if (!ignore) setComments([]);
        }

        if (!ignore) setErr("");
      } catch (e) {
        if (!ignore) setErr(safeErr(e, "불러오기 실패"));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [id]);

  const reloadPostOnly = async () => {
    try {
      const p = await fetchPost(id);
      setPost(p);
    } catch (e) {
      setErr(safeErr(e, "글 재조회 실패"));
    }
  };

  const onToggleHide = async () => {
    if (!post) return;
    try {
      const isHidden =
        post.hidden === true || post.hidden === 1 || post.hidden === "1";
      const nextHidden = isHidden ? 0 : 1;
      await updatePost(id, { hidden: nextHidden });
      await reloadPostOnly();
    } catch (e) {
      alert(safeErr(e, "노출 상태 변경 실패"));
    }
  };

  const onDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deletePost(id, post?.author);
      nav("/community");
    } catch (e) {
      alert(safeErr(e, "삭제 실패"));
    }
  };

  const onDeleteComment = async (cid) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(id, cid);
      try {
        const cs = await fetchComments(id, { size: 50 });
        setComments(cs);
      } catch {
        setComments([]);
      }
    } catch (e) {
      alert(safeErr(e, "댓글 삭제 실패"));
    }
  };

  if (loading) return <div className="card full-page">불러오는 중…</div>;
  if (err) return <div className="card full-page">{err}</div>;
  if (!post) return <div className="card full-page">데이터가 없습니다.</div>;

  return (
    <div className="card full-page">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ marginRight: "auto" }}>게시글 #{post.id}</h3>
        <button onClick={onToggleHide} style={btn}>
          {post.hidden === 1 || post.hidden === true ? "노출하기" : "숨기기"}
        </button>
        <button
          onClick={onDelete}
          style={{ ...btn, background: "#fee2e2", color: "#dc2626" }}
        >
          삭제
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginTop: 8,
        }}
      >
        <div>
          <h2 style={{ margin: "6px 0" }}>{post.title || "(제목 없음)"}</h2>
          <div style={{ color: "#6b7280", marginBottom: 12 }}>
            {post.authorName || post.author || "-"} ·{" "}
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : "-"}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>{post.content || "-"}</div>

          {post.images?.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              {post.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`첨부-${i}`}
                  style={{
                    width: 160,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 style={{ marginTop: 0 }}>댓글 ({comments.length})</h4>
          {comments.length === 0 ? (
            <div style={{ padding: 12, color: "#6b7280" }}>
              댓글이 없습니다.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {comments.map((c) => (
                <li
                  key={c.id}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "10px 0",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {c.authorName || c.author || "-"}
                  </div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleString()
                      : "-"}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
                    {c.content}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      style={{ ...btn, padding: "6px 10px" }}
                    >
                      댓글 삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const btn = {
  padding: "8px 12px",
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#3730a3",
  borderRadius: 8,
  cursor: "pointer",
};
