import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./Pages/Dashboard.jsx";
import Login from "./Pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./Auth/AuthContext.js";
import Header from "./components/Header.jsx";
import Sidebar from "./components/Sidebar.jsx";
import UserManagement from "./Pages/UserManagement.jsx";
import MapPage from "./Pages/MapPage.jsx";
import AlertPage from "./Pages/AlertPage.jsx";
import ReportListPage from "./Pages/ReportListPage.jsx";
import ReportPage from "./Pages/ReportPage.jsx";
/* ✅ 커뮤니티 페이지 import */
import CommunityList from "./Pages/CommunityList.jsx";
import CommunityDetail from "./Pages/CommunityDetail.jsx";
import EditManagement from "./Pages/EditManagement.jsx";
import "./App.css";


/*

const importedComponents = {
  Dashboard,
  Login,
  ProtectedRoute,
  AuthProvider,
  Header,
  Sidebar,
  UserManagement,
  MapPage,
  AlertPage,
  ReportListPage,
  ReportPage,
  CommunityList,
  CommunityDetail,
  EditManagement,
};

Object.entries(importedComponents).forEach(([name, component]) => {
  console.log(`[component-check] ${name}`, {
    type: typeof component,
    component,
    default: component?.default,
  });
});

*/

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <AuthProvider>
      {!isLoginPage && <Header onMenuClick={toggleSidebar} />}
      {!isLoginPage && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      <main
        className="main-content"
        style={{
          paddingLeft: isSidebarOpen && !isLoginPage ? "250px" : "0",
          paddingTop: isLoginPage ? "0" : "60px",
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports-list"
            element={
              <ProtectedRoute>
                <ReportListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />

          {/* ✅ 커뮤니티 라우트 2개 */}
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community/:id"
            element={
              <ProtectedRoute>
                <CommunityDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertPage />
              </ProtectedRoute>
            }
          />
        <Route
          path="/edit"
          element={
            <ProtectedRoute>
              <EditManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
