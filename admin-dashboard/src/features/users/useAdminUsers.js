// src/features/users/useAdminUsers.js
import { useCallback, useEffect, useMemo, useState } from "react";
import client, { getErrMsg } from "../../api/client";

/**
 * q: 검색어
 * status: 'ACTIVE' | 'INACTIVE' | ''(전체)
 * page/size: 페이징
 * 서버 라우트: GET /api/admin/users
 */
export function useAdminUsers(q = "", status = "", page = 0, size = 50) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 요청 파라미터 메모
  const params = useMemo(() => ({ q, status, page, size }), [q, status, page, size]);
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // baseURL이 .../api 이므로 경로에는 /api를 붙이지 않음
      const { data } = await client.get("/admin/users", { params });
      setItems(data?.items ?? []);
      setError("");
    } catch (e) {
      setError(getErrMsg(e, "사용자 목록 불러오기 실패"));
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (email, patch) => {
      try {
        await client.patch(`/admin/users/${encodeURIComponent(email)}`, patch);
        await load();
      } catch (e) {
        setError(getErrMsg(e, "상태 변경 실패"));
      }
    },
    [load]
  );

  const remove = useCallback(
    async (email) => {
      try {
        await client.delete(`/admin/users/${encodeURIComponent(email)}`);
        await load();
      } catch (e) {
        setError(getErrMsg(e, "삭제 실패"));
      }
    },
    [load]
  );

  return { items, loading, error, update, remove };
}
