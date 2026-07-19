// src/features/users/reports/useRegionsLocal.js
import { useCallback, useMemo, useState } from "react";
import { listSidos, listSigungu, listDongs } from "./regionsData";

/**
 * 지역 선택 전용 프런트 훅 (정적 데이터 기반)
 * - 시도 목록은 즉시 제공
 * - 시도 선택 시 시군구 목록 계산
 * - 시군구 선택 시 동/읍/면 목록 계산
 */
export default function useRegionsLocal() {
  const sidos = useMemo(() => listSidos(), []);

  const [sigunguList, setSigunguList] = useState([]);
  const [dongList, setDongList] = useState([]);

  const loadSigungu = useCallback((sido) => {
    setSigunguList(listSigungu(sido));
    setDongList([]); // 시도 바뀌면 동은 초기화
  }, []);

  const loadDongs = useCallback((sido, sigungu) => {
    setDongList(listDongs(sido, sigungu));
  }, []);

  return { sidos, sigunguList, dongList, loadSigungu, loadDongs };
}
