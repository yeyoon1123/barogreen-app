import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/barogreen.css";
import App from "./App";
// ✅ 전역 스타일 한 곳만 사용
import "./index.css";
import { AuthProvider } from "./Auth/AuthContext.js";

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
