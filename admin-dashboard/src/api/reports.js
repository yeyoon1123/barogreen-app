// src/api/reports.js
import client from "./client";

/** id가 숫자든 객체든 안전하게 꺼내기 */
function normId(idOrObj) {
  if (idOrObj == null) return undefined;
  if (typeof idOrObj === "object") return idOrObj.id ?? idOrObj.reportId;
  return idOrObj;
}

/** 목록 */
export function fetchReports(params = {}) {
  // GET /api/reports
  return client.get("/reports", { params });
}

/** 단건 */
export function fetchReport(idOrObj) {
  const id = normId(idOrObj);
  if (id == null) throw new Error("fetchReport: id is required");
  return client.get(`/reports/${id}`);
}

/** 부분 업데이트(담당부서/상태 등) */
export function updateReport(idOrObj, patch = {}) {
  const id = normId(idOrObj);
  if (id == null) throw new Error("updateReport: id is required");
  return client.put(`/reports/${id}`, patch);
}

/** 상태만 변경(구형 호환) */
export function updateReportStatus(idOrObj, patch = {}) {
  const id = normId(idOrObj);
  if (id == null) throw new Error("updateReportStatus: id is required");

  const keys = Object.keys(patch);
  const onlyStatus = keys.length === 1 && keys[0] === "status";

  if (onlyStatus) {
    return client.put(`/reports/${id}/status`, { status: patch.status });
  }
  return updateReport(id, patch);
}

/** 삭제 */
export function deleteReport(idOrObj) {
  const id = normId(idOrObj);
  if (id == null) throw new Error("deleteReport: id is required");
  return client.delete(`/reports/${id}`);
}
