// src/Auth/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);
const KEY = "admin_session_token_v1";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try { localStorage.removeItem("token"); } catch {}
    const token = sessionStorage.getItem(KEY);
    setIsAuthenticated(!!token);
  }, []);

  const login = async (email, password) =>
    new Promise((resolve) => {
      setTimeout(() => {
        if (email === "admin@wave.com" && password === "1234") {
          sessionStorage.setItem(KEY, "fake-admin-session-token");
          setIsAuthenticated(true);
          resolve({ ok: true });
        } else resolve({ ok: false, error: "잘못된 이메일 또는 비밀번호입니다." });
      }, 200);
    });

  const logout = () => {
    try { sessionStorage.removeItem(KEY); } catch {}
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
