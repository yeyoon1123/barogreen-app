// src/components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className="sidebar-baro"
      style={{
        width: 260,
        height: "100vh",
        position: "fixed",
        top: 60,
        left: isOpen ? 0 : -260,
        transition: "left .28s ease",
        zIndex: 999,
        padding: 18
      }}
    >
      <div style={{ padding: "6px 6px" }}>
        <h4 style={{ margin:"6px 6px 16px", color:"#0f766e" }}>메뉴</h4>
        <ul style={{ listStyle: "none", padding: 0, margin:0, display:"grid", gap:8 }}>
          <li>
            <Link to="/" onClick={toggleSidebar}>대시보드</Link>
          </li>
          <li>
            <Link to="/reports-list" onClick={toggleSidebar}>신고관리</Link>
          </li>
          <li>
            <Link to="/community" onClick={toggleSidebar}>커뮤니티</Link>
          </li>
          <li>
            <Link to="/user-management" onClick={toggleSidebar}>사용자관리</Link>
          </li>
          <li>
            <Link to="/edit" onClick={toggleSidebar}> 정정요청관리</Link>
          </li>
        </ul>
      </div>
    </div>
  );
};
export default Sidebar;
