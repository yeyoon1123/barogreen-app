// app/screens/CompanyMapScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
  TextInput,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import { API_BASE } from "../core/config";
import { http } from "../core/http";
import { compressImage } from "../utils/image";
import { getBus } from "../utils/bus";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CompanyMapView from "../components/company/CompanyMapView";
import CompanyReportList from "../components/company/CompanyReportList";
import CompanyDetailModal from "../components/company/CompanyDetailModal";

// ===== 스타일 상수 =====
const GREEN = "#2DB36F";
const GREEN_DARK = "#1E8A52";
const GREEN_LIGHT = "#E6F4EA";
const GREEN_BORDER = "#B7E1C0";

const STATUS_TEXT = {
  pending: "접수 완료",
  processing: "처리 진행 중",
  completed: "처리 완료",
};
const COLOR = {
  pending: "#F4D35E",
  processing: "#F4D35E",
  completed: "#1B5E20",
};

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop";

const KOREA_INITIAL_REGION = {
  latitude: 36.5,
  longitude: 127.8,
  latitudeDelta: 8.5,
  longitudeDelta: 7.5,
};
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const SHEET_MIN = 200; // 기본 반쯤 보이는 높이
const SHEET_MAX = SCREEN_H * 0.6; // 위로 쫙 펼쳤을 때 높이

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";

// ===== 유틸 =====

// API_BASE 에서 마지막 / 제거한 origin
const API_ORIGIN = API_BASE.replace(/\/+$/, "");

// 이미지 URL 정규화
function normalizeUrl(src) {
  if (!src) return "";
  let s = String(src).trim();

  // 윈도우 경로일 수 있으니 역슬래시를 슬래시로
  s = s.replace(/\\/g, "/");

  // 이미 http/https 인 경우
  if (s.startsWith("http://") || s.startsWith("https://")) {
    // localhost / 127.0.0.1 이면 API_BASE 기준으로 교체
    if (s.includes("://localhost") || s.includes("://127.0.0.1")) {
      const path = s.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, "");
      return `${API_ORIGIN}${path}`;
    }
    return s;
  }

  // /uploads/... 같은 상대경로
  if (s.startsWith("/")) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/${s}`;
}

// ===== 유틸 =====
function toRad(v) {
  return (v * Math.PI) / 180;
}

function normalizePhotoUrl(src) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return `${API_BASE}/${src}`;
}

function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function decodePolyline(encoded = "") {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates = [];
  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates; 
}
function fmtKo(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("ko-KR");
  } catch {
    return String(dt);
  }
}
function imagePickerOptions(base = {}) {
  const MT = ImagePicker?.MediaType?.Images;
  if (MT) return { quality: 0.9, mediaTypes: [MT], ...base };
  return { quality: 0.9, mediaTypes: ImagePicker.MediaTypeOptions.Images, ...base };
}

// CompanyMapScreen.js 안의 normalizeReport() 부분만 교체
// 서버 응답 정규화


// 기존코드인데 만약 사진이 안뜨면 이걸로 변경
// function normalizeReport(r) {
//   if (!r) return null;
//   const lat = Number(r.lat ?? r.latitude);
//   const lng = Number(r.lng ?? r.longitude);
//   const status = String(r.status || "").toLowerCase();

//   // 원본 값 모아서 URL 정규화
//   const rawPhoto =
//     r.photoUri || r.photo_url || r.photo || r.imageUrl || r.image_url || r.image || "";
//   const rawCompleted =
//     r.completedPhoto ||
//     r.completed_photo ||
//     r.completedImage ||
//     r.completedImageUrl ||
//     r.completed_image_url ||
//     "";

//   const photoUri = normalizeUrl(rawPhoto);
//   const completedPhoto = normalizeUrl(rawCompleted);

//   const completedAt =
//     r.completedAt || r.completed_at || r.completedTime || r.completed_time || null;

//   const category = r.category || r.trashType || r.trash_type || r.trashCategory || "";
//   const trashType = r.trashType || category || "";
//   const trashTypeLabel = r.trashTypeLabel || r.trash_type_label || category || "";

//   const reporterId =
//     r.reporterId || r.memberLoginId || r.member_login_id || r.memberNickname || r.nickname || "";

//   return {
//     ...r,
//     reportId: r.reportId ?? r.id ?? r.report_id ?? r._id,
//     lat,
//     lng,
//     status,
//     photoUri,
//     completedPhoto,
//     completedAt,
//     address: r.address || r.addr || "",
//     note: r.note || "",
//     category,
//     trashType,
//     trashTypeLabel,
//     reporterId,
//     reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),
//   };
// }

function normalizeReport(r) {
  if (!r) return null;
  const lat = Number(r.lat ?? r.latitude);
  const lng = Number(r.lng ?? r.longitude);
 // (변경 후)
const status = String(r.status || "").toLowerCase();

const rawPhoto =
  r.photoUri || r.photo_url || r.photo || r.imageUrl || r.image_url || r.image || "";
const rawCompleted =
  r.completedPhoto ||
  r.completed_photo ||
  r.completedImage ||
  r.completedImageUrl ||
  r.completed_image_url ||
  "";

const photoUri = normalizePhotoUrl(rawPhoto);
const completedPhoto = normalizePhotoUrl(rawCompleted);

  const completedAt =
    r.completedAt || r.completed_at || r.completedTime || r.completed_time || null;

  const category = r.category || r.trashType || r.trash_type || r.trashCategory || "";
  const trashType = r.trashType || category || "";
  const trashTypeLabel = r.trashTypeLabel || r.trash_type_label || category || "";

  const reporterId =
    r.reporterId || r.memberLoginId || r.member_login_id || r.memberNickname || r.nickname || "";

  return {
    ...r,
    reportId: r.reportId ?? r.id ?? r.report_id ?? r._id,
    lat,
    lng,
    status,
    photoUri,
    completedPhoto,
    completedAt,
    address: r.address || r.addr || "",
    note: r.note || "",
    category,
    trashType,
    trashTypeLabel,
    reporterId,
    reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),
  };
}



export default function CompanyMapScreen() {
  const mapRef = useRef(null);
  const watchRef = useRef(null);
  const movingRef = useRef(false);
  const mountedRef = useRef(true);
  const cacheRef = useRef(new Map());

  // 정정요청 모달 상태
  const [corrModalOpen, setCorrModalOpen] = useState(false);  
  const [corrTarget, setCorrTarget] = useState(null);
  const [corrCategory, setCorrCategory] = useState("허위신고"); // 기본값
  const [corrNote, setCorrNote] = useState("");

  // 하단 신고 목록 시트 높이 / 드래그 상태
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN)).current;
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // 세로로 어느 정도 움직였을 때만 드래그 인식
        return Math.abs(gesture.dy) > 10;
      },
      onPanResponderRelease: (_, gesture) => {
        // 위로 스와이프 → 펼치기
        if (gesture.dy < -20) {
          Animated.timing(sheetHeight, {
            toValue: SHEET_MAX,
            duration: 220,
            useNativeDriver: false,
          }).start(() => setSheetExpanded(true));
        }
        // 아래로 스와이프 → 반쯤 상태로
        else if (gesture.dy > 20) {
          Animated.timing(sheetHeight, {
            toValue: SHEET_MIN,
            duration: 220,
            useNativeDriver: false,
          }).start(() => setSheetExpanded(false));
        }
      },
    }),
  ).current;

  const [region, setRegion] = useState(KOREA_INITIAL_REGION);
  const [pos, setPos] = useState(null);
  const [flags, setFlags] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const [navigating, setNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceM, setDistanceM] = useState(0);
  const [navBusy, setNavBusy] = useState(false);
  const navActiveRef = useRef(false);
  const [completing, setCompleting] = useState(false);


// CompanyMapScreen 컴포넌트 안

useEffect(() => {
  // ✅ 12초마다 현재 region 기준으로 서버 재조회
  const timer = setInterval(() => {
    if (region) {
      fetchFlags(region);
    }
  }, 3000); // 12초 간격 (필요시 조정)

  return () => clearInterval(timer);
}, [region]);


  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      navActiveRef.current = false;
      if (watchRef.current?.remove) {
        try {
          watchRef.current.remove();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // ✅ 에뮬레이터(시뮬레이터)에서는 자동 이동을 아예 안 함
      if (!Device.isDevice) {
        return; // KOREA_INITIAL_REGION 그대로 유지
      }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);
        if (cur?.coords && isFinite(cur.coords.latitude) && isFinite(cur.coords.longitude)) {
          setPos(cur.coords);
          try {
            mapRef.current?.animateCamera(
              {
                center: { latitude: cur.coords.latitude, longitude: cur.coords.longitude },
                zoom: 12,
              },
              { duration: 600 },
            );
          } catch {}
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    fetchFlags(region);
  }, [region]);

  async function fetchFlags(rgn) {
    if (!rgn) return;
    const isNation = rgn.latitudeDelta >= 5 || rgn.longitudeDelta >= 5;
    const neLat = isNation ? 38.65 : rgn.latitude + rgn.latitudeDelta / 2;
    const swLat = isNation ? 33.0 : rgn.latitude - rgn.latitudeDelta / 2;
    const neLng = isNation ? 131.1 : rgn.longitude + rgn.longitudeDelta / 2;
    const swLng = isNation ? 124.6 : rgn.longitude - rgn.longitudeDelta / 2;

    try {
      const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;
      const res = await http(
        url,
        { headers: { Accept: "application/json" } },
        { timeout: 10000, retries: 1 },
      );

      const data = await res.json().catch(() => ({}));

      const normalized = (data.reports || [])
        .map(normalizeReport)
        .filter(r => isFinite(r.lat) && isFinite(r.lng));
      const merged = normalized.map(it => {
        const c = cacheRef.current.get(it.reportId);
        if (c?.status === "completed") {
          return {
            ...it,
            status: "completed",
            completedPhoto: it.completedPhoto || c.completedPhoto,
            completedAt: it.completedAt || c.completedAt,
          };
        }
        return it;
      });
      if (mountedRef.current) setFlags(merged);
    } catch (e) {
      console.log("[company] fetch fail", e);
    }
  }

  const openDetail = r => {
    setCurrent(r);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setCurrent(null);
  };

  async function getRoutePath(origin, destination) {
    const ok = p => p && isFinite(p.latitude) && isFinite(p.longitude);
    if (!ok(origin) || !ok(destination)) return [];
    if (!GOOGLE_MAPS_API_KEY) return [origin, destination];
    try {
      const o = `${origin.latitude},${origin.longitude}`;
      const d = `${destination.latitude},${destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${o}&destination=${d}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`directions HTTP ${res.status}`);
      const json = await res.json();
      const points = json?.routes?.[0]?.overview_polyline?.points || "";
      if (!points) return [origin, destination];
      const decoded = decodePolyline(points);
      const safe = decoded.filter(p => isFinite(p.latitude) && isFinite(p.longitude));
      if (safe.length < 2) return [origin, destination];
      return safe;
    } catch (e) {
      console.log("[directions] fail", e);
      return [origin, destination];
    }
  }

  const startNavigation = async r => {
    if (navBusy) return;
    setNavBusy(true);
    try {
      if (!r) {
        Alert.alert("오류", "목표가 없습니다.");
        return;
      }
      if (!pos || !isFinite(pos.latitude) || !isFinite(pos.longitude)) {
        Alert.alert("안내", "현재 위치를 먼저 가져오는 중입니다.");
        return;
      }
      const lat = Number(r.lat),
        lng = Number(r.lng);
      if (!isFinite(lat) || !isFinite(lng)) {
        Alert.alert("오류", "목표 위치가 올바르지 않습니다.");
        return;
      }

      const origin = { latitude: Number(pos.latitude), longitude: Number(pos.longitude) };
      const target = { latitude: lat, longitude: lng };

      const path = await getRoutePath(origin, target);
      if (path.length >= 2) {
        setRouteCoords(path);
        setDistanceM(Math.round(distanceKm(origin, target) * 1000));
        setDetailOpen(false);
        setNavigating(true);
      } else {
        Alert.alert("오류", "경로를 계산할 수 없습니다.");
        return;
      }

      if (watchRef.current?.remove) {
        try {
          watchRef.current.remove();
        } catch {}
      }
      navActiveRef.current = true;

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1500, distanceInterval: 2 },
        async loc => {
          try {
            if (!navActiveRef.current || !mountedRef.current) return;
            const ok =
              loc?.coords && isFinite(loc.coords.latitude) && isFinite(loc.coords.longitude);
            if (!ok) return;

            const me = {
              latitude: Number(loc.coords.latitude),
              longitude: Number(loc.coords.longitude),
            };
            setPos(loc.coords);

            try {
              mapRef.current?.animateCamera({ center: me, zoom: 16 }, { duration: 350 });
            } catch {}

            if (GOOGLE_MAPS_API_KEY) {
              if (!movingRef.current) {
                movingRef.current = true;
                try {
                  const newPath = await getRoutePath(me, target);
                  setRouteCoords(newPath);
                } finally {
                  setTimeout(() => {
                    movingRef.current = false;
                  }, 8000);
                }
              }
            } else {
              setRouteCoords([me, target]);
            }

            const d = Math.round(distanceKm(me, target) * 1000);
            setDistanceM(d);

            if (d <= 30) {
              stopNavigation();
              setCurrent(r);
              setDetailOpen(true);
            }
          } catch (err) {
            console.log("[watch cb] error", err);
          }
        },
      );
      watchRef.current = sub;
    } catch (err) {
      console.log("[startNavigation] error", err);
      Alert.alert("오류", "길찾기를 시작할 수 없습니다.");
    } finally {
      setNavBusy(false);
    }
  };

  const stopNavigation = () => {
    navActiveRef.current = false;
    setNavigating(false);
    setRouteCoords([]);
    setDistanceM(0);
    if (watchRef.current?.remove) {
      try {
        watchRef.current.remove();
      } catch {}
    }
  };

  const uploadPhotoIfNeeded = async localUri => {
    if (!localUri || /^https?:\/\//.test(localUri)) return localUri;
    const shrunk = await compressImage(localUri);
    const form = new FormData();
    form.append("file", { uri: shrunk, name: "complete.jpg", type: "image/jpeg" });
    const res = await http(
      `${API_BASE}/api/upload`,
      { method: "POST", body: form },
      { retries: 1 },
    );

    const json = await res.json().catch(() => ({}));
    return json.url || json.path || json.location || localUri;
  };

  const markCompleted = async () => {
    if (!current || completing) return;
    try {
      setCompleting(true);
      const completedAt = new Date().toISOString();

      let asset = null;
      if (Platform.OS === "ios" && !Device.isDevice) {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert("권한 필요", "앨범 권한을 허용해주세요.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync(imagePickerOptions());
        if (!res || res.canceled) return;
        asset = res.assets?.[0];
      } else {
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (!cam.granted) {
          Alert.alert("권한 필요", "카메라 권한을 허용해주세요.");
          return;
        }
        const res = await ImagePicker.launchCameraAsync(imagePickerOptions());
        if (!res || res.canceled) return;
        asset = res.assets?.[0];
      }
      if (!asset?.uri) return;

      const photoUrl = await uploadPhotoIfNeeded(asset.uri);
      const res = await http(
        `${API_BASE}/api/trash/${encodeURIComponent(current.reportId)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({ status: "completed", photoUri: photoUrl, completedAt }),
        },
        { timeout: 10000, retries: 1 },
      );

      setFlags(prev =>
        prev.map(it =>
          it.reportId === current.reportId
            ? { ...it, status: "completed", completedPhoto: photoUrl, completedAt }
            : it,
        ),
      );
      setCurrent(c =>
        c ? { ...c, status: "completed", completedPhoto: photoUrl, completedAt } : c,
      );
      cacheRef.current.set(current.reportId, {
        status: "completed",
        completedPhoto: photoUrl,
        completedAt,
      });

      try {
        getBus().emit("report-updated", {
          reportId: current.reportId,
          status: "completed",
          completedPhoto: photoUrl,
          completedAt,
        });
      } catch {}

      // ✅ 여기서 쿠폰 발급 플래그 저장 (회원 신고만)
      try {
        const reporter = current?.reporterId || "";
        if (reporter && String(reporter).toLowerCase() !== "guest") {
          await AsyncStorage.setItem("BG_REWARD_COUPON", "available");
        }
      } catch (e) {
        console.log("[coupon] save fail", e);
      }

      Alert.alert("완료", "민원이 처리 완료로 변경되었습니다.");
    } catch (e) {
      console.log("[complete] fail", e);
      Alert.alert("오류", `완료 처리에 실패했습니다.\n${String(e.message || e)}`);
    } finally {
      setCompleting(false);
    }
  };
  const handleCorrectionRequest = r => {
    if (!r?.reportId) {
      Alert.alert("오류", "정정요청 대상 신고를 찾을 수 없습니다.");
      return;
    }

    // 그냥 모달 상태만 셋팅
    setCorrTarget(r);
    setCorrCategory("허위신고");
    setCorrNote("");
    setCorrModalOpen(true);
  };

  // 정정요청 실제 전송
  const submitCorrectionRequest = async () => {
    if (!corrTarget?.reportId) {
      Alert.alert("오류", "정정요청 대상 신고를 찾을 수 없습니다.");
      return;
    }

    const reasonText = `[${corrCategory}] ${corrNote || ""}`.trim();

    try {
      const res = await http(
        `${API_BASE}/api/correction-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            reportId: corrTarget.reportId,
            reason: reasonText,
            // requesterLoginId: 회사 로그인ID 있으면 여기 넣기 (없으면 생략 가능)
          }),
        },
        { timeout: 8000, retries: 0 },
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      Alert.alert("완료", "정정 요청이 접수되었습니다.");
      setCorrModalOpen(false);
    } catch (e) {
      console.log("[correction] fail", e);
      Alert.alert("오류", "정정 요청 전송 중 문제가 발생했습니다.");
    }
  };

  const handleDeleteReport = r => {
    if (!r?.reportId) {
      Alert.alert("오류", "삭제할 신고 정보를 찾을 수 없습니다.");
      return;
    }

    const idStr = String(r.reportId);
    const isLocalOnly = idStr.startsWith("temp-") || idStr.startsWith("mock-seed-");

    Alert.alert("삭제", "이 신고를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          // 1) 서버에 있는 신고면 DELETE 호출
          if (!isLocalOnly) {
            try {
              const res = await http(
                `${API_BASE}/api/trash/${encodeURIComponent(idStr)}`,
                { method: "DELETE" },
                { timeout: 8000, retries: 0 },
              );
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } catch (e) {
              console.log("[company delete] error", e);
              Alert.alert(
                "오류",
                "서버에서 신고 삭제 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.",
              );
              // 서버 상태 기준으로 재동기화
              if (region) fetchFlags(region);
              return;
            }
          }

          // 2) 로컬 상태에서 제거
          setFlags(prev => prev.filter(it => String(it.reportId) !== idStr));

          // 3) 상세창에서 보고 있던 항목이면 닫기
          setCurrent(cur => (cur && String(cur.reportId) === idStr ? null : cur));
          setDetailOpen(false);

          // 4) 뷰포트 기준 서버 재조회로 동기화
          if (region) fetchFlags(region);
        },
      },
    ]);
  };

  const sortedFlags = useMemo(() => {
    const toMs = v => {
      try {
        return v ? new Date(v).getTime() : 0;
      } catch {
        return 0;
      }
    };

    // 최신 신고 순(촬영일시 기준)으로 정렬
    return [...flags].sort((a, b) => {
      const ta = toMs(a.reportedAt);
      const tb = toMs(b.reportedAt);
      return tb - ta; // 큰(최근) 시간 먼저
    });
  }, [flags]);

  return (
    <View style={{ flex: 1 }}>
      <CompanyMapView
        mapRef={mapRef}
        region={region}
        onRegionChangeComplete={setRegion}
        COLOR={COLOR}
        STATUS_TEXT={STATUS_TEXT}
        FALLBACK_IMG={FALLBACK_IMG}
        GREEN={GREEN}
        navigating={navigating}
        routeCoords={routeCoords}
        flags={flags}
        onMarkerPress={openDetail}
      />

      {navigating && (
        <View style={styles.navBanner}>
          <Text style={styles.navText}>쓰레기까지 약 {Math.max(0, distanceM)} m</Text>
          <TouchableOpacity onPress={stopNavigation} style={styles.navStopBtn}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>길찾기 종료</Text>
          </TouchableOpacity>
        </View>
      )}
      <Animated.View
        style={[styles.sheetContainer, { height: sheetHeight }]}
        {...panResponder.panHandlers}
      >
        <CompanyReportList
          sortedFlags={sortedFlags}
          onPressItem={openDetail}
          STATUS_TEXT={STATUS_TEXT}
          COLOR={COLOR}
          FALLBACK_IMG={FALLBACK_IMG}
          GREEN_DARK={GREEN_DARK}
          GREEN_BORDER={GREEN_BORDER}
          onDelete={handleDeleteReport}
          onCorrection={handleCorrectionRequest}
        />
      </Animated.View>
      {/* 🔻 여기에 정정요청 모달 추가 */}
      {corrModalOpen && (
        <Modal
          visible={corrModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCorrModalOpen(false)}
        >
          <View style={styles.corrBackdrop}>
            <View style={styles.corrCard}>
              <Text style={styles.corrTitle}>정정 요청</Text>

              <Text style={styles.corrLabel}>카테고리</Text>
              <View style={styles.corrChipRow}>
                {["허위신고", "기존투기구역", "기타"].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCorrCategory(cat)}
                    style={[styles.corrChip, corrCategory === cat && styles.corrChipActive]}
                  >
                    <Text
                      style={[
                        styles.corrChipText,
                        corrCategory === cat && styles.corrChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.corrLabel}>상세 내용</Text>
              <TextInput
                style={styles.corrInput}
                multiline
                placeholder="정정 요청 내용을 적어주세요."
                value={corrNote}
                onChangeText={setCorrNote}
              />

              <View style={styles.corrBtnRow}>
                <TouchableOpacity
                  style={styles.corrCancelBtn}
                  onPress={() => setCorrModalOpen(false)}
                >
                  <Text style={styles.corrCancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.corrSubmitBtn} onPress={submitCorrectionRequest}>
                  <Text style={styles.corrSubmitText}>보내기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <CompanyDetailModal
        visible={!!detailOpen}
        current={current}
        onClose={closeDetail}
        STATUS_TEXT={STATUS_TEXT}
        GREEN={GREEN}
        GREEN_DARK={GREEN_DARK}
        SCREEN_W={SCREEN_W}
        fmtKo={fmtKo}
        navBusy={navBusy}
        startNavigation={startNavigation}
        markCompleted={markCompleted}
        completing={completing}
        onDelete={handleDeleteReport}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navBanner: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: GREEN_DARK,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navText: { color: "#fff", fontWeight: "bold" },
  navStopBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#00000055",
    borderRadius: 8,
  },
  sheetContainer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
  },
  // 🔔 정정요청 모달
  corrBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    bottom: 100,
  },
  corrCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
  },
  corrTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  corrLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  corrChipRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  corrChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 6,
  },
  corrChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  corrChipText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  corrChipTextActive: {
    color: "#fff",
  },
  corrInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    textAlignVertical: "top",
  },
  corrBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  corrCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 8,
  },
  corrCancelText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  corrSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: GREEN_DARK,
  },
  corrSubmitText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
});
