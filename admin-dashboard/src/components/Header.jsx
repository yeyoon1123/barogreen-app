import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext.js";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // 제거
// import { faBell, faSignOutAlt } from "@fortawesome/free-solid-svg-icons"; // 제거

const Header = ({ onMenuClick }) => {
  const { logout } = useAuth();

  // --- 알림 관련 state (notifs, unreadCount, panelOpen) 모두 제거 ---
  // const [notifs, setNotifs] = useState([...]);
  // const unreadCount = useMemo(...);
  // const [panelOpen, setPanelOpen] = useState(false);
  // const togglePanel = () => setPanelOpen((v) => !v);
  // const markAsRead = (id) => ...;
  // const markAllAsRead = () => ...;

  return (
    <div style={wrap} className="bg-baro-header">
      <button onClick={onMenuClick} style={menuBtn}>☰</button>

      <div style={{ flexGrow: 1 }}>
        <Link to="/" style={{ textDecoration: "none", color: "white" }}>
          <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: .2 }}>BaroGreen 관리자</h3>
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        
        {/* --- 알림 아이콘 및 패널 <div> 전체 제거 --- */}
        {/*
        <div style={{ position: "relative", marginRight: 15 }}>
          <button onClick={togglePanel} style={bellBtn}>
            <FontAwesomeIcon icon={faBell} size="lg" />
          </button>
          {unreadCount > 0 && <span className="badge-baro">{unreadCount}</span>}
          {panelOpen && (
            <div style={panel} className="panel-baro">
              ... (알림 패널 내용) ...
            </div>
          )}
        </div>
        */}

        <button onClick={logout} style={logoutBtn} className="btn-outline-baro">로그아웃</button>
      </div>
    </div>
  );
};

/* ===== styles (앱 무드로 교체) ===== */
const wrap = {
  display:"flex", alignItems:"center", padding:"0 20px",
  color:"#fff", height:60,
  position:"fixed", top:0, left:0, right:0, zIndex:1000,
  justifyContent:"space-between",
  boxShadow:"0 2px 10px rgba(0,0,0,.06)"
};
const menuBtn = { background:"rgba(255,255,255,.18)", border:"none", color:"white", fontSize:22, cursor:"pointer", marginRight:20, width:40, height:40, borderRadius:12 };

// --- 알림 관련 스타일 (bellBtn, panel, panelHead, linkBtn) 제거 ---
// const bellBtn = { ... };
// const panel = { ... };
// const panelHead = { ... };
// const linkBtn = { ... };

const logoutBtn = { padding:"8px 15px", cursor:"pointer", borderRadius:20, fontWeight:800, fontSize:14 };

export default Header;