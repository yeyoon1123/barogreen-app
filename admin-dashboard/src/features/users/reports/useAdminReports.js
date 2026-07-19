// src/features/users/reports/useAdminReports.js
import { useCallback, useEffect, useState } from "react";
import {
  fetchReports,
  updateReport,
  updateReportStatus,
} from "../../../api/reports";

export const REPORT_TYPES = {};
export const typeLabel = (t) => REPORT_TYPES[t] ?? t ?? "-";

export function useAdminReports(params) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchReports(params);
      const raw = data.items ?? data.reports ?? data ?? [];
      const t = data.total ?? raw.length ?? 0;

      // ✅ id 표준화: reportId만 있으면 id에 복사
      const normalized = (raw || []).map((r) => ({ ...r, id: r.id ?? r.reportId }));

      setItems(normalized);
      setTotal(t);
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e?.message || "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  // ✅ 상태만 patch면 /{id}/status, 아니면 /{id}
  const update = useCallback(async (idOrRow, patch) => {
    const id = typeof idOrRow === "object" ? (idOrRow.id ?? idOrRow.reportId) : idOrRow;
    if (id == null) throw new Error("update: id is required");
    const keys = Object.keys(patch || {});
    if (keys.length === 1 && keys[0] === "status") {
      await updateReportStatus(id, { status: patch.status });
    } else {
      await updateReport(id, patch);
    }
    await load();
  }, [load]);

  return { items, total, loading, error, reload: load, update };
}
