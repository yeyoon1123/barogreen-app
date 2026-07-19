// src/Pages/ReportPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchReport, updateReportStatus, deleteReport } from "../api/reports";
import { typeLabel } from "../features/users/reports/useAdminReports";

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await fetchReport(id);
      setItem(data);
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  // 상태 변경 공통 헬퍼
  const patchStatus = async (statusCode) => {
    await updateReportStatus(id, { status: statusCode });
    await load();
  };

  // 버튼: 접수완료(NEW), 처리완료(DONE)
  const onMarkReceived = () => patchStatus("NEW");
  const onMarkCompleted = () => patchStatus("DONE");

  // 버튼: 신고 삭제
  const onDelete = async () => {
    if (!window.confirm("정말 이 신고를 삭제하시겠습니까?")) return;
    try {
      await deleteReport(id);
      alert("신고가 삭제되었습니다.");
      navigate("/reports-list");
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "삭제 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  if (loading) return <div className="card full-page">불러오는 중…</div>;
  if (!item) return <div className="card full-page">데이터가 없습니다.</div>;

  const displayId = item.id ?? item.reportId;
  const photo = item.photoUrl || item.photoUri || null;

  return (
    <div className="card full-page">
      <h3>신고 상세 #{displayId}</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        <div>
          <div>
            <b>유형:</b> {typeLabel?.(item.type) ?? item.type ?? "-"}
          </div>
          <div>
            <b>상태:</b> {labelStatus(item.status)}
          </div>
          <div>
            <b>완료시각:</b>{" "}
            {item.completedAt
              ? new Date(item.completedAt).toLocaleString()
              : "-"}
          </div>
          <div>
            <b>행정동:</b> {item.dong}
          </div>
          <div>
            <b>주소:</b> {item.address}
          </div>
          <div>
            <b>메모:</b> {item.note || "-"}
          </div>
          <div>
            <b>좌표:</b> {item.lat}, {item.lng}
          </div>
          <div>
            <b>접수시간:</b>{" "}
            {item.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : item.reportedAt
              ? new Date(item.reportedAt).toLocaleString()
              : "-"}
          </div>

          {/* 상태 변경 / 삭제 버튼들 */}
          <div style={{ marginTop: 20 }}>
            <button style={btn} onClick={onMarkReceived}>
              접수완료
            </button>
            <button style={btnPrimary} onClick={onMarkCompleted}>
              처리완료
            </button>
            <button
              style={{
                ...btn,
                background: "#fee2e2",
                color: "#b91c1c",
                borderColor: "#fecaca",
                marginLeft: 4,
              }}
              onClick={onDelete}
            >
              신고 삭제
            </button>
          </div>
        </div>

        <div>
          {photo ? (
            <img
              src={photo}
              alt="첨부"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            />
          ) : (
            <div
              style={{
                padding: 20,
                border: "1px dashed #e5e7eb",
                borderRadius: 12,
                color: "#6b7280",
              }}
            >
              첨부 사진 없음
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 상태 텍스트
function labelStatus(s) {
  const up = (s || "").toUpperCase();
  return up === "NEW"
    ? "접수완료"
    : up === "DONE"
    ? "처리완료"
    : up === "IN_PROGRESS"
    ? "진행중"
    : "미배정";
}

// 버튼 스타일
const btn = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#3730a3",
  cursor: "pointer",
  marginRight: 4,
};

const btnPrimary = {
  ...btn,
  background: "#ecfdf5",
  color: "#047857",
  borderColor: "#a7f3d0",
};
