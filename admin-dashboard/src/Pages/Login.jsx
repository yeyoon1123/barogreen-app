// src/Pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.js";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("admin@wave.com");
  const [pass, setPass] = useState("1234");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !pass) return setErr("이메일과 비밀번호를 입력하세요.");
    const res = await login(email.trim(), pass);
    if (res.ok) navigate("/", { replace: true });
    else setErr(res.error || "로그인 실패");
  };

  return (
    <div style={wrap}>
      {/* soft background blobs */}
      <div style={heroBlob} />
      <div style={heroBlob2} />

      <form style={card} onSubmit={onSubmit}>
        <h1 style={title}>BaroGreen 관리자 로그인</h1>
        <p style={sub}>불법 쓰레기 투기 신고 전용 관리자 페이지</p>

        <label style={field}>
          <span style={label}>이메일</span>
          <input
            style={input}
            type="email"
            placeholder="admin@wave.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>

        <label style={field}>
          <span style={label}>비밀번호</span>
          <input
            style={input}
            type="password"
            placeholder="1234"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {err && <div style={errBox}>{err}</div>}

        <button type="submit" style={primaryBtn}>
          <span style={primaryLabel}>로그인</span>
          <div style={primarySheen} />
        </button>
      </form>
    </div>
  );
}

/* ===== Design Tokens (앱과 동일) ===== */
const GREEN = "#34D399"; // emerald-400
const GREEN_DARK = "#10B981"; // emerald-500
const BG = "#F7FAF5";
const INK = "#5B7285";
const BORDER_MUTE = "#E7EEF2";

/* ===== Styles ===== */
const wrap = {
  position: "relative",
  minHeight: "100vh",
  background: BG,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  overflow: "hidden", // ✅ 스크롤바 제거 핵심
};

const heroBlob = {
  position: "absolute",
  top: -140,
  left: -120,
  width: 420,
  height: 420,
  borderRadius: 210,
  backgroundColor: "#E9F9F0",
  opacity: 0.9,
  zIndex: 0,
};
const heroBlob2 = {
  position: "absolute",
  top: -110,
  right: -80,
  width: 240,
  height: 240,
  borderRadius: 120,
  backgroundColor: "#F0FFF7",
  opacity: 0.6,
  zIndex: 0,
};

const card = {
  position: "relative",
  width: "100%",
  maxWidth: 460,
  background: "#fff",
  border: `1px solid ${BORDER_MUTE}`,
  borderRadius: 20,
  boxShadow: "0 8px 20px rgba(16,185,129,.10)",
  padding: "26px 26px 28px",
  zIndex: 1,
};

const title = {
  margin: 0,
  textAlign: "center",
  color: GREEN_DARK,
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: 0.2,
};
const sub = {
  marginTop: 8,
  textAlign: "center",
  color: INK,
  fontSize: 14,
};

const field = { display: "block", marginTop: 16 };
const label = {
  display: "block",
  marginBottom: 6,
  color: "#475569",
  fontSize: 13,
  fontWeight: 700,
};
const input = {
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: `1px solid ${BORDER_MUTE}`,
  padding: "0 14px",
  fontSize: 15,
  outline: "none",
  background: "#fff",
  boxShadow: "inset 0 1px 0 rgba(0,0,0,0.02)",
};

const errBox = {
  marginTop: 14,
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#B91C1C",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 700,
  textAlign: "center",
};

const primaryBtn = {
  position: "relative",
  marginTop: 18,
  width: "100%",
  height: 54,
  borderRadius: 18,
  border: "none",
  background: GREEN,
  boxShadow: "0 6px 14px rgba(16,185,129,.18)",
  cursor: "pointer",
};
const primaryLabel = {
  color: "#fff",
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: 0.2,
};
const primarySheen = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 24,
  background: "rgba(255,255,255,.12)",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  pointerEvents: "none",
};
