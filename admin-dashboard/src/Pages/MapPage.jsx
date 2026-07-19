// src/Pages/MapPage.jsx
import React from "react";
import Dashboard from "./Dashboard.jsx";
export default function MapPage() {
  // 지도만 크게 보고 싶을 때는 Dashboard의 지도 섹션을 재사용하거나
  // 별도 구현 가능. 여기선 간단히 대시보드를 그대로 재사용.
  return <Dashboard />;
}
