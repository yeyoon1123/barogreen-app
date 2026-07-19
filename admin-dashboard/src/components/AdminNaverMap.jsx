// src/components/AdminNaverMap.jsx
import { useEffect, useRef, useState } from "react";

const NCP_KEY_ID = "av7vxzn81a";

// 두 엔드포인트를 순차 시도 (일부 네트워크/캐시 이슈 대응)
const SCRIPT_CANDIDATES = [
  `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`,
  `https://oapi.maps.naver.com/openapi/v3/maps.js?ncpKeyId=${NCP_KEY_ID}`,
];

function loadNaverSDK() {
  return new Promise((resolve, reject) => {
    if (window.naver?.maps) return resolve("already");

    const EXISTING_ID = "naver-map-sdk";
    const existing = document.getElementById(EXISTING_ID);
    if (existing) {
      // 이미 로드 중이면 완료만 대기
      const wait = setInterval(() => {
        if (window.naver?.maps) {
          clearInterval(wait);
          resolve("attached");
        }
      }, 50);
      setTimeout(() => {
        clearInterval(wait);
        reject(new Error("naver sdk wait timeout"));
      }, 10000);
      return;
    }

    let idx = 0;
    const tryNext = () => {
      if (idx >= SCRIPT_CANDIDATES.length) {
        reject(new Error("naver sdk load failed (all endpoints)"));
        return;
      }
      const url = SCRIPT_CANDIDATES[idx++];
      const s = document.createElement("script");
      s.id = EXISTING_ID;
      s.src = url;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        if (window.naver?.maps) resolve(url);
        else {
          s.remove();
          tryNext();
        }
      };
      s.onerror = () => {
        s.remove();
        tryNext();
      };
      document.head.appendChild(s);
    };
    tryNext();
  });
}

export default function AdminNaverMap({
  items = [],
  height = 480,               // ⬆ 기본 높이 확대
  typeLabel,
  statusColor,
  defaultZoom = 9,            // ⬆ 초기 확대 정도
  initialCenter = { lat: 36.5, lng: 127.9 }, // 대한민국 중심
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState("");

  // 초기 맵 생성
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadNaverSDK();
        if (cancelled || !hostRef.current) return;

        mapRef.current = new window.naver.maps.Map(hostRef.current, {
          center: new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng),
          zoom: defaultZoom,
          minZoom: 4,
          maxZoom: 18,
        });
      } catch (e) {
        console.error(e);
        setError("네이버 지도 SDK를 불러오지 못했습니다. (네트워크/도메인/DNS 확인)");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [defaultZoom, initialCenter.lat, initialCenter.lng]);

  // 마커 갱신 & 영역 맞추기
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.naver?.maps) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m?.setMap(null));
    markersRef.current = [];

    const bounds = new window.naver.maps.LatLngBounds();

    if (Array.isArray(items) && items.length > 0) {
      items.forEach((r) => {
        const lat = Number(r.lat ?? r.latitude);
        const lng = Number(r.lng ?? r.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const pos = new window.naver.maps.LatLng(lat, lng);
        const color = statusColor ? statusColor(r.status) : "#2dd4bf";

        const marker = new window.naver.maps.Marker({
          position: pos,
          map,
          icon: {
            content:
              `<div style="width:14px;height:14px;border-radius:50%;background:${color};` +
              `border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></div>`,
            anchor: new window.naver.maps.Point(7, 7),
          },
        });

        const info = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding:8px;max-width:240px;font-size:13px;line-height:1.4">
              <b>${typeLabel ? typeLabel(r.type) : r.type || "신고"}</b><br/>
              <span style="color:${color};font-weight:700">${r.status || ""}</span><br/>
              <div>${(r.dong || "")} ${r.address || ""}</div>
              <small>${r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}</small>
            </div>`,
        });

        window.naver.maps.Event.addListener(marker, "click", () => info.open(map, marker));
        markersRef.current.push(marker);
        bounds.extend(pos);
      });
    }

    // 아이템이 있으면 fitBounds, 없으면 기본 위치/줌으로 세팅
    try {
      if (items.length > 0 && !bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 10, left: 10, bottom: 10, right: 10 });
      } else {
        map.setCenter(new window.naver.maps.LatLng(initialCenter.lat, initialCenter.lng));
        map.setZoom(defaultZoom);
      }
    } catch (e) {
      console.warn("fitBounds skipped:", e);
    }
  }, [items, typeLabel, statusColor, defaultZoom, initialCenter.lat, initialCenter.lng]);

  return (
    <div
      style={{ position: "relative", width: "100%", height }}
      className="baro-card"
    >
      <div
        ref={hostRef}
        style={{ position: "absolute", inset: 0 }}
        className="map-host-rounded"
      />
      {!!error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0f766e",
            background: "rgba(249,253,251,.86)",
            fontWeight: 800,
            borderRadius: 16,
            border: "1px dashed #CFEFE2",
            textAlign: "center",
            padding: 16,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
