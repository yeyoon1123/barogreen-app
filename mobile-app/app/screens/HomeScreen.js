  /* eslint-disable no-undef */
  import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from "react";
  import {
    Platform,
    View,
    Text,
    Alert,
    Dimensions,
    Animated,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
  } from "react-native";
  import * as Device from "expo-device";
  import * as Location from "expo-location";
  import * as ImagePicker from "expo-image-picker";
  import { UserContext } from "../context/UserContext";
  import { API_BASE } from "../core/config";
  import { http } from "../core/http";
  import { compressImage } from "../utils/image";
  import { enqueueReport, flushReports } from "../core/offlineQueue";
  import { ensureCamera, ensureLocation } from "../core/permissions";
  import { hOk, hErr } from "../core/haptics";
  import { useFocusEffect } from "@react-navigation/native";
  import BottomTabBar from "../components/common/BottomTabBar";
  import { setAllFlags as cacheSetAllFlags } from "../core/reportCache";
  import { Ionicons } from "@expo/vector-icons";

  import {
    GREEN_DARK,
    GREEN_LIGHT,
    GREEN_BORDER,
    INK,
    REPORT_STATUS,
    MARKER_COLOR,
    KOREA_BOUNDS,
    KOREA_INITIAL_REGION,
    MOCK_PHOTOS,
    DEV_MOCK,
    SEARCH_RADIUS_KM,
  } from "../constants/homeTheme";
  import { googleMapStyle } from "../constants/mapStyle";
  import { getBus } from "../utils/bus";
  import { distanceKm, extractLatLngFromExif, formatAddress, offsetMeters } from "../utils/geo";

  import FilterChips from "../components/home/FilterChips";
  import ReportModal from "../components/home/ReportModal";
  import DetailModal from "../components/home/DetailModal";
  import ReportSheet from "../components/home/ReportSheet";
  import MapSection from "../components/home/MapSection";
  import FloatingButtons from "../components/home/FloatingButtons";
  import BottomActionPanel from "../components/home/BottomActionPanel";
  import DisposalModal from "../components/home/DisposalModal";
  import { historyAddReport, historyAddDisposal } from "../core/historyStore";
  import AsyncStorage from "@react-native-async-storage/async-storage";

  const { height: SCREEN_H } = Dimensions.get("window");
  const withTimeout = (p, ms = 15000) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

  function normalizeReport(r) {
    if (!r) return null;
    const lat = Number(r.lat ?? r.latitude);
    const lng = Number(r.lng ?? r.longitude);
    const status = String(r.status || "").toLowerCase();
    const photoUri =
      r.photoUri || r.photo_url || r.photo || r.imageUrl || r.image_url || r.image || "";
    const completedPhoto =
      r.completedPhoto ||
      r.completed_photo ||
      r.completedImage ||
      r.completedImageUrl ||
      r.completed_image_url ||
      "";

    // ✅ category 원천값 확보
    // const category = r.category || r.trashType || r.trashTypeLabel || "";
    const category = r.category ?? "";

    // 🟢 reporterId 통일(여러 필드 케이스 방어)
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
      address: r.address || r.addr || "",
      note: r.note || "",
      reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),

      // ✅ DetailModal/ReportSheet가 읽는 키로 호환 매핑
      category,
      trashType: category,
      trashTypeLabel: category,
      type: r.type || (category ? "disposal" : "report"),

      reporterId,
    };
  }

  export default function HomeScreen({ navigation }) {
    const { user, setUser } = useContext(UserContext);
    const isGuest = user?.guest === true;

    // ✅ reporterId 계산(로그인 정보 여러 경우 커버)
    const rawReporterId =
      user?.loginId ||
      user?.nickname ||
      user?.username ||
      user?.email ||
      (user?.id != null ? String(user.id) : "");
    const reporterId = isGuest ? "guest" : rawReporterId || String(user?.id || "");

    const mapRef = useRef(null);
    const [guideVisible, setGuideVisible] = useState(false);
    const watchRef = useRef(null);
    const [region, setRegion] = useState(null);
    const [pos, setPos] = useState(null);

    const hasAutoMovedRef = useRef(false);

    const [flags, setFlags] = useState([]);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [trackMarkerViews, setTrackMarkerViews] = useState(true);

    // ===== 신고 모달 상태 =====
    const [reportOpen, setReportOpen] = useState(false);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoCoord, setPhotoCoord] = useState(null);
    const [photoAddress, setPhotoAddress] = useState("");

    // ✅ 버리기 모달 상태
    const [disposeOpen, setDisposeOpen] = useState(false);
    const [dCategory, setDCategory] = useState("");
    const [dNote, setDNote] = useState("");
    const [dSubmitting, setDSubmitting] = useState(false);
    const [dPhoto, setDPhoto] = useState(null);
    const [dPhotoCoord, setDPhotoCoord] = useState(null);
    const [dPhotoAddress, setDPhotoAddress] = useState("");

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailReport, setDetailReport] = useState(null);

    const SHEET_MIN = Math.round(SCREEN_H * 0.28);
    const SHEET_HALF = Math.round(SCREEN_H * 0.5);
    const SHEET_MAX = Math.round(SCREEN_H * 0.72);

    const sheetHeight = useRef(new Animated.Value(0)).current;
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);

    const [toast, setToast] = useState("");
    const [shotPool, setShotPool] = useState([]);

    // 🔔 알림 관련 상태
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);

    const notifLoadedRef = useRef(false);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

      const openNotificationModal = () => {
    // 모달 열기
    setNotifOpen(true);
    // 읽음 처리
    setNotifications(prev =>
      (prev || []).map(n => ({ ...n, read: true }))
    );
  };


    // ===== 지도/센터 핸들러 =====
    const fetchAbortRef = useRef(null);
    const debounceRef = useRef(null);

    const safeFetchFlags = useCallback(
      rgn => {
        if (!rgn) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
          try {
            fetchAbortRef.current?.abort();
          } catch {}
          const controller = new AbortController();
          fetchAbortRef.current = controller;

          const isNationView = rgn.latitudeDelta >= 5 || rgn.longitudeDelta >= 5;
          const neLat = isNationView ? KOREA_BOUNDS.maxLat : rgn.latitude + rgn.latitudeDelta / 2;
          const swLat = isNationView ? KOREA_BOUNDS.minLat : rgn.latitude - rgn.latitudeDelta / 2;
          const neLng = isNationView ? KOREA_BOUNDS.maxLng : rgn.longitude + rgn.longitudeDelta / 2;
          const swLng = isNationView ? KOREA_BOUNDS.minLng : rgn.longitude - rgn.longitudeDelta / 2;
          const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;

          try {
            const res = await http(
              url,
              { headers: { Accept: "application/json" }, signal: controller.signal },
              { timeout: 10000, retries: 1 },
            );
            const data = await res.json();
            const normalized = (data.reports || []).map(normalizeReport);

            setFlags(prev => {
              const mocks = prev.filter(f => String(f.reportId).startsWith("mock-seed-"));
              const next = [...normalized, ...mocks];
              return next;
            });
          } catch (e) {
            if (e.name !== "AbortError") console.log("[reports] fetch fail/timeout", e);
          }
        }, 250);
      },
      [/* API_BASE는 상수지만 linter 만족용으로 넣었다면 여기 포함 가능 */],
    );

    // ✅ 앱 첫 진입 시 5초 동안 안내 문구 표시
    useEffect(() => {
      (async () => {
        try {
          const seen = await AsyncStorage.getItem("hasSeenGuide");
          if (!seen) {
            setGuideVisible(true);
            const t = setTimeout(async () => {
              setGuideVisible(false);
              await AsyncStorage.setItem("hasSeenGuide", "true");
            }, 5000);
            return () => clearTimeout(t);
          }
        } catch (e) {
          console.log("guide flag error", e);
        }
      })();
    }, []);

    // ===== 이벤트 버스 업데이트 =====
    useEffect(() => {
      const off = getBus().on("report-updated", ({ reportId, status, completedPhoto }) => {
        requestAnimationFrame(() => {
          setFlags(prev =>
            prev.map(r =>
              r.reportId === reportId
                ? {
                    ...r,
                    status: status || r.status,
                    completedPhoto: completedPhoto || r.completedPhoto,
                  }
                : r,
            ),
          );
          setDetailReport(d =>
            d && d.reportId === reportId
              ? {
                  ...d,
                  status: status || d.status,
                  completedPhoto: completedPhoto || d.completedPhoto,
                }
              : d,
          );
        });
      });
      return () => {
        try {
          off && off();
        } catch {}
      };
    }, []);

    // ===== 위치/워치 초기화 =====
    useEffect(() => {
      (async () => {
        setRegion(KOREA_INITIAL_REGION);

        // ✅ 첫 데이터 프리패치
        safeFetchFlags(KOREA_INITIAL_REGION);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) return;

        let first = await Location.getLastKnownPositionAsync().catch(() => null);
        if (!first)
          first = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 8000,
          }).catch(() => null);
        if (first?.coords) setPos(first.coords);

        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
          loc => setPos(loc.coords),
        );
      })();

      return () => {
        if (watchRef.current?.remove) watchRef.current.remove();
      };
    }, []);

     useFocusEffect(
  useCallback(() => {
    let cancelled = false;

    (async () => {
      try {
        await flushReports(API_BASE);
      } catch {}

      // 🔑 알림 조회용 키
      const notifKey =
  (!isGuest &&
    (user?.loginId ||
      user?.email ||
      user?.username ||
      (user?.id != null ? String(user.id) : ""))) ||
  reporterId;
      // ✅ notifKey 있고, 아직 이 포커스 사이클에서 알림을 안 불러왔을 때만 호출
      if (notifKey && !notifLoadedRef.current) {
        try {
          const res = await http(
            `${API_BASE}/api/notifications?loginId=${encodeURIComponent(notifKey)}`,
            { headers: { Accept: "application/json" } },
            { timeout: 8000, retries: 0 },
          );

          const json = await res.json().catch(() => ({}));
          const list = Array.isArray(json) ? json : json.notifications || json.data || [];

          console.log("[notif] loaded", list);
          if (!cancelled) {
            setNotifications(list || []);
            notifLoadedRef.current = true;  // ✅ 이 포커스 동안은 다시 안 부르게 플래그
          }
        } catch (e) {
          console.log("[notif] load fail", e);
        }
      }

      // 지도 플래그는 계속 새로고침
      if (region) safeFetchFlags(region);
    })();

    return () => {
      cancelled = true;
      // 화면에서 빠져나갈 때 플래그 초기화 → 다음에 홈으로 돌아오면 다시 1번만 로드
      notifLoadedRef.current = false;
    };
  }, [region, safeFetchFlags, user?.loginId, user?.email, user?.username, user?.id]),
);



    // 마커 렌더링 최적화
    useEffect(() => {
      setTrackMarkerViews(true);
      const t = setTimeout(() => setTrackMarkerViews(false), 800);
      return () => clearTimeout(t);
    }, [flags]);

    const fetchFlags = async rgn => {
      if (!rgn) return;
      const isNationView = rgn.latitudeDelta >= 5 || rgn.longitudeDelta >= 5;
      const neLat = isNationView ? KOREA_BOUNDS.maxLat : rgn.latitude + rgn.latitudeDelta / 2;
      const swLat = isNationView ? KOREA_BOUNDS.minLat : rgn.latitude - rgn.latitudeDelta / 2;
      const neLng = isNationView ? KOREA_BOUNDS.maxLng : rgn.longitude + rgn.longitudeDelta / 2;
      const swLng = isNationView ? KOREA_BOUNDS.minLng : rgn.longitude - rgn.longitudeDelta / 2;

      const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;
      try {
        const res = await http(
          url,
          { headers: { Accept: "application/json" } },
          { timeout: 10000, retries: 1 },
        );
        const data = await res.json();
        const normalized = (data.reports || []).map(normalizeReport);

        setFlags(prev => {
          const mocks = prev.filter(f => String(f.reportId).startsWith("mock-seed-"));
          return [...normalized, ...mocks];
        });
      } catch (e) {
        console.log("[reports] fetch fail/timeout", e);
      }
    };

    // flags 변경 시 캐시에 반영
    useEffect(() => {
      if (!flags?.length) return;
      const id = setTimeout(() => {
        try {
          cacheSetAllFlags(flags);
        } catch {}
      }, 0);
      return () => clearTimeout(id);
    }, [flags]);

    // === 데모 시드 ===
    const seedTenMocksOnceRef = useRef(false);
    const seedTenMocks = useCallback(() => {
      const statuses = ["pending", "completed"];
      const samples = [];
      let tries = 0;
      const SEEDS = [
        { name: "서울", lat: 37.5665, lng: 126.978 },
        { name: "부산", lat: 35.1796, lng: 129.0756 },
        { name: "대구", lat: 35.8714, lng: 128.6014 },
        { name: "대전", lat: 36.3504, lng: 127.3845 },
        { name: "광주", lat: 35.1595, lng: 126.8526 },
        { name: "인천", lat: 37.4563, lng: 126.7052 },
        { name: "울산", lat: 35.5384, lng: 129.3114 },
        { name: "세종", lat: 36.48, lng: 127.289 },
        { name: "제주", lat: 33.4996, lng: 126.5312 },
        { name: "수원", lat: 37.2636, lng: 127.0286 },
      ];
      while (samples.length < 10 && tries < 500) {
        tries++;
        const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];
        const radius = 200 + Math.random() * 1500;
        const theta = Math.random() * Math.PI * 2;
        const { lat, lng } = offsetMeters(
          { lat: seed.lat, lng: seed.lng },
          Math.cos(theta) * radius,
          Math.sin(theta) * radius,
        );
        if (
          lat < KOREA_BOUNDS.minLat ||
          lat > KOREA_BOUNDS.maxLat ||
          lng < KOREA_BOUNDS.minLng ||
          lng > KOREA_BOUNDS.maxLng
        )
          continue;
        const dup = samples.some(
          s =>
            distanceKm({ latitude: lat, longitude: lng }, { latitude: s.lat, longitude: s.lng }) *
              1000 <
            120,
        );
        if (dup) continue;
        samples.push({
          reportId: `mock-seed-${seed.name}-${samples.length}`,
          lat,
          lng,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          photoUri: MOCK_PHOTOS[0],
          address: `${seed.name} 인근 (임시)`,
          note: Math.random() < 0.35 ? "대형 폐기물 있음" : "",
          reportedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
        });
      }
      setFlags(prev => {
        const nonSeed = prev.filter(f => !String(f.reportId).startsWith("mock-seed-"));
        const next = [...nonSeed, ...samples];
        return next;
      });
    }, []);

    useEffect(() => {
      if (seedTenMocksOnceRef.current) return;
      seedTenMocksOnceRef.current = true;
      seedTenMocks();
    }, [seedTenMocks]);

    const onRegionChangeComplete = r => setRegion(r);

    const handleMapPress = async e => {
      if (sheetOpen) {
        closeSheet();
        return;
      }
      const { coordinate } = e.nativeEvent;
      setSelectedCenter({ lat: coordinate.latitude, lng: coordinate.longitude, address: "" });
      openSheetToHalf();
      try {
        const g = await Location.reverseGeocodeAsync({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });
        if (g?.[0]) setSelectedCenter(prev => ({ ...prev, address: formatAddress(g[0]) }));
      } catch {}
    };

    const handleMarkerPress = report => {
      setSelectedCenter({ lat: report.lat, lng: report.lng, address: report.address || "" });
      openSheetToHalf();
    };

    // ===== 목록/필터 =====
    const categorized = useMemo(() => {
      if (!selectedCenter) {
        return {
          all: [],
          pending: [],
          processing: [],
          completed: [],
          counts: { pending: 0, processing: 0, completed: 0 },
        };
      }

      const center = { latitude: selectedCenter.lat, longitude: selectedCenter.lng };

      // 1) 반경 내 전체 플래그
      const nearby = flags.filter(
        f => distanceKm(center, { latitude: f.lat, longitude: f.lng }) <= SEARCH_RADIUS_KM,
      );

      // 2) 비회원이면 "신고만", 회원이면 disposal 포함
      const base = isGuest
        ? nearby.filter(f => (f.type || "report") !== "disposal")
        : nearby;

      // 3) 상태별 분류는 base 기준
      const pending = base.filter(r => r.status === "pending");
      const processing = base.filter(r => r.status === "processing");
      const completed = base.filter(r => r.status === "completed");

      return {
        all: base,
        pending,
        processing,
        completed,
        counts: {
          pending: pending.length,
          processing: processing.length,
          completed: completed.length,
        },
      };
    }, [flags, selectedCenter, isGuest]);

    const visibleMarkers = useMemo(() => {
      let base = flags;
      if (isGuest) {
        base = base.filter(f => (f.type || "report") !== "disposal");
      }
      if (filterStatus === "ALL") return base;
      return base.filter(f => f.status === filterStatus.toLowerCase());
    }, [flags, filterStatus, isGuest]);

    const getDisplayPhoto = useCallback(
      report => report?.photoUri || shotPool[0] || MOCK_PHOTOS[0],
      [shotPool],
    );

    // ===== 이동/시트 컨트롤 =====
    const moveToMyLocation = async () => {
      try {
        let target = pos;
        if (!target) {
          const cur = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 8000,
          });
          target = cur.coords;
          setPos(cur.coords);
        }
        mapRef.current?.animateCamera(
          { center: { latitude: target.latitude, longitude: target.longitude }, zoom: 16 },
          { duration: 600 },
        );
      } catch {
        Alert.alert("오류", "현재 위치로 이동할 수 없습니다.");
      }
    };

    const moveToAll = () => {
      mapRef.current?.animateToRegion(KOREA_INITIAL_REGION, 600);
    };

    const openSheetToHalf = () => {
      setSheetOpen(true);
      Animated.timing(sheetHeight, {
        toValue: SHEET_HALF,
        duration: 220,
        useNativeDriver: false,
      }).start();
    };

    const openSheetToMax = () => {
      setSheetOpen(true);
      Animated.timing(sheetHeight, {
        toValue: SHEET_MAX,
        duration: 220,
        useNativeDriver: false,
      }).start();
    };

    const closeSheet = () => {
      Animated.timing(sheetHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start(() =>
        setSheetOpen(false),
      );
    };

    // ===== 공통: 주소 역지오 =====
    const resolveAddress = async (coord, setAddr) => {
      if (!coord) {
        setAddr("");
        return;
      }
      try {
        const g = await Location.reverseGeocodeAsync(coord);
        if (g?.[0]) setAddr(formatAddress(g[0]));
      } catch {
        setAddr("");
      }
    };

    // ===== 신고용 사진 픽커 =====
    const pickImage = async () => {
      try {
        if (Platform.OS === "ios" && !Device.isDevice) {
          Alert.alert("안내", "시뮬레이터는 카메라가 없어 앨범에서 선택합니다.");
          const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!libPerm.granted) return Alert.alert("권한 필요", "앨범 접근 권한을 허용해주세요.");
          const lib = await ImagePicker.launchImageLibraryAsync({
            quality: 0.9,
            exif: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!lib || lib.canceled) return;
          const asset = lib.assets?.[0];
          if (!asset) return;
          setPhoto(asset);
          setShotPool(prev => [asset.uri, ...prev].slice(0, 50));
          const exifCoord = extractLatLngFromExif(asset?.exif);
          const fallback = pos ? { latitude: pos.latitude, longitude: pos.longitude } : null;
          const target = exifCoord || fallback;
          setPhotoCoord(target);
          await resolveAddress(target, setPhotoAddress);
          if (target) mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
          return;
        }
        if (!(await ensureCamera())) return;
        if (!(await ensureLocation())) return;
        const result = await ImagePicker.launchCameraAsync({ quality: 0.9, exif: true });
        if (!result || result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return Alert.alert("실패", "사진을 불러오지 못했습니다.");
        setPhoto(asset);
        setShotPool(prev => [asset.uri, ...prev].slice(0, 50));

        const exifCoord = extractLatLngFromExif(asset?.exif);
        let gpsCoord = null;
        try {
          const cur = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 5000,
              timeout: 3000,
            }),
            new Promise((_, rej) => setTimeout(() => rej(new Error("gps-timeout")), 3000)),
          ]).catch(() => null);
          if (cur?.coords)
            gpsCoord = { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
        } catch {}

        const target =
          exifCoord ||
          gpsCoord ||
          (pos ? { latitude: pos.latitude, longitude: pos.longitude } : null);
        setPhotoCoord(target);
        await resolveAddress(target, setPhotoAddress);
        if (!target) Alert.alert("안내", "사진 위치를 확인할 수 없습니다.");
        else mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
      } catch (err) {
        console.log("[pickImage] error:", err);
        Alert.alert("오류", "카메라/앨범을 여는 중 문제가 발생했습니다.");
      }
    };

    // ✅ 버리기용 사진 픽커
    const pickImageForDispose = async () => {
      try {
        if (Platform.OS === "ios" && !Device.isDevice) {
          const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!libPerm.granted) return Alert.alert("권한 필요", "앨범 접근 권한을 허용해주세요.");
          const lib = await ImagePicker.launchImageLibraryAsync({
            quality: 0.9,
            exif: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });
          if (!lib || lib.canceled) return;
          const asset = lib.assets?.[0];
          if (!asset) return;
          setDPhoto(asset);
          const exifCoord = extractLatLngFromExif(asset?.exif);
          const fallback = pos ? { latitude: pos.latitude, longitude: pos.longitude } : null;
          const target = exifCoord || fallback;
          setDPhotoCoord(target);
          await resolveAddress(target, setDPhotoAddress);
          if (target) mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
          return;
        }

        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (!cam.granted) return Alert.alert("권한 필요", "카메라 권한을 허용해주세요.");
        const loc = await Location.requestForegroundPermissionsAsync();
        if (!loc.granted) return Alert.alert("권한 필요", "위치 권한을 허용해주세요.");

        const result = await ImagePicker.launchCameraAsync({ quality: 0.9, exif: true });
        if (!result || result.canceled) return;
        const asset = result.assets?.[0];
        if (!asset) return Alert.alert("실패", "사진을 불러오지 못했습니다.");
        setDPhoto(asset);

        const exifCoord = extractLatLngFromExif(asset?.exif);
        let gpsCoord = null;
        try {
          const cur = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              maximumAge: 5000,
              timeout: 3000,
            }),
            new Promise((_, rej) => setTimeout(() => rej(new Error("gps-timeout")), 3000)),
          ]).catch(() => null);
          if (cur?.coords)
            gpsCoord = { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
        } catch {}

        const target =
          exifCoord ||
          gpsCoord ||
          (pos ? { latitude: pos.latitude, longitude: pos.longitude } : null);
        setDPhotoCoord(target);
        await resolveAddress(target, setDPhotoAddress);
        if (!target) Alert.alert("안내", "사진 위치를 확인할 수 없습니다.");
        else mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
      } catch (err) {
        console.log("[pickImage dispose] error:", err);
        Alert.alert("오류", "카메라/앨범을 여는 중 문제가 발생했습니다.");
      }
    };

    async function uploadPhotoIfNeeded(localUri) {
      if (!localUri || /^https?:\/\//.test(localUri)) return localUri;
      const shrunk = await compressImage(localUri);
      const form = new FormData();
      form.append("file", { uri: shrunk, name: "photo.jpg", type: "image/jpeg" });
      const res = await http(
        `${API_BASE}/api/upload`,
        { method: "POST", body: form },
        { retries: 1 },
      );

      const json = await res.json();
      return json.url;
    }

    const submitReport = async () => {
      if (submitting) return;
      if (!photo) return Alert.alert("안내", "불법 투기 현장 사진을 먼저 선택해주세요.");
      const target = photoCoord || pos;
      if (!target) return Alert.alert("안내", "사진 위치/현재 위치를 확인할 수 없습니다.");

      let address = photoAddress;
      if (!address) {
        try {
          const g = await Location.reverseGeocodeAsync(target);
          if (g?.[0]) address = formatAddress(g[0]);
        } catch {}
      }

      const localUri = photo.uri;
      const tempReportId = `temp-${Date.now()}`;
      const newReport = {
        reportId: tempReportId,
        lat: target.latitude,
        lng: target.longitude,
        status: "pending",
        photoUri: localUri,
        address: address || "주소 정보 없음",
        note,
        reportedAt: new Date().toISOString(),
      };
      setFlags(prev => {
        const next = [...prev, newReport];
        return next;
      });

      // ✅ 마이 히스토리 저장 & 브로드캐스트
      try {
        await historyAddReport({
          id: tempReportId,
          type: "report",
          address: newReport.address,
          photoUri: newReport.photoUri,
          note: newReport.note,
          status: newReport.status,
          reportedAt: newReport.reportedAt,
          reporterId,
        });
        getBus().emit("HISTORY_UPDATED");
      } catch {}

      setReportOpen(false);
      setNote("");
      setPhoto(null);
      setPhotoCoord(null);
      setPhotoAddress("");
      setToast("신고가 성공적으로 접수되었습니다");
      setTimeout(() => setToast(""), 2000);
      if (DEV_MOCK) return;

      setSubmitting(true);
      (async () => {
        try {
          let photoUrl = "";
          try {
            photoUrl = await withTimeout(uploadPhotoIfNeeded(localUri), 15000);
          } catch (e) {
            console.log("[upload] fail/timeout", e);
            photoUrl = "";
          }
          const res = await http(
            `${API_BASE}/api/trash/report`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                Accept: "application/json",
              },
              body: JSON.stringify({
                lat: target.latitude,
                lng: target.longitude,
                note,
                photoUri: photoUrl,
                address,

                // ✅ 로그인 유저 정보 함께 전달
                memberId: user?.id,
                memberLoginId: user?.loginId,
                memberNickname: user?.nickname,
                guest: isGuest,

                reporterId,
              }),
            },
            { timeout: 10000, retries: 1 },
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          if (region) fetchFlags(region);
          hOk();
        } catch (e) {
          console.log("[report] network error or timeout", e);
          try {
            await enqueueReport({
              lat: target.latitude,
              lng: target.longitude,
              note,
              photoUri: photoUrl,
              address,
            });
            Alert.alert("오프라인 저장", "네트워크 복구 시 자동 전송됩니다.");
          } catch {
            Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
            hErr();
          }
        } finally {
          setSubmitting(false);
        }
      })();
    };

    // ✅ 버리기 제출
    const submitDispose = async () => {
      if (dSubmitting) return;
      if (!dCategory) return Alert.alert("안내", "쓰레기 종류를 선택해주세요.");
      if (!dPhoto) return Alert.alert("안내", "사진을 먼저 선택해주세요.");

      const target = dPhotoCoord || pos;
      if (!target) return Alert.alert("안내", "사진 위치/현재 위치를 확인할 수 없습니다.");

      let address = dPhotoAddress;
      if (!address) {
        try {
          const g = await Location.reverseGeocodeAsync(target);
          if (g?.[0]) address = formatAddress(g[0]);
        } catch {}
      }

      // 로컬 즉시 반영
      const tempId = `temp-dispose-${Date.now()}`;
      setFlags(prev => {
        const next = [
          ...prev,
          {
            reportId: tempId,
            lat: target.latitude,
            lng: target.longitude,
            status: "pending",
            photoUri: dPhoto.uri,
            address: address || "주소 정보 없음",
            note: dNote ? `[${dCategory}] ${dNote}` : `[${dCategory}]`,
            reportedAt: new Date().toISOString(),
            type: "disposal",
            category: dCategory,

            reporterId: user?.loginId || user?.nickname || "guest",
          },
        ];
        return next;
      });

      // ✅ 마이 히스토리 저장 & 브로드캐스트
      try {
        await historyAddDisposal({
          id: tempId,
          type: "disposal",
          address: address || "주소 정보 없음",
          photoUri: dPhoto?.uri,
          category: dCategory,
          note: dNote || "",
          reportedAt: new Date().toISOString(),
          reporterId,
        });
        getBus().emit("HISTORY_UPDATED");
      } catch {}

      setDisposeOpen(false);
      setDSubmitting(true);

      const resetDisposeState = () => {
        setDCategory("");
        setDNote("");
        setDPhoto(null);
        setDPhotoCoord(null);
        setDPhotoAddress("");
        setDSubmitting(false);
        setToast("배출 정보가 등록되었습니다");
        setTimeout(() => setToast(""), 2000);
      };

      if (DEV_MOCK) return resetDisposeState();

      try {
        let photoUrl = "";
        try {
          photoUrl = await withTimeout(uploadPhotoIfNeeded(dPhoto.uri), 15000);
        } catch (e) {
          console.log("[upload dispose] fail/timeout", e);
          photoUrl = "";
        }

        await http(
          `${API_BASE}/api/trash/report`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Accept: "application/json",
            },
            body: JSON.stringify({
              lat: target.latitude,
              lng: target.longitude,
              note: dNote,
              category: dCategory,
              type: "disposal",
              photoUri: photoUrl,
              address,

              memberId: user?.id,
              memberLoginId: user?.loginId,
              memberNickname: user?.nickname,
              guest: isGuest,

              reporterId,
            }),
          },
          { timeout: 10000, retries: 1 },
        );

        if (region) fetchFlags(region);
      } catch (e) {
        console.log("[dispose] network error or timeout", e);
        Alert.alert("오류", "배출 등록 처리 중 문제가 발생했습니다.");
      } finally {
        resetDisposeState();
      }
    };

    // ===== 상세 모달 =====
    const openDetail = report => {
      const norm = normalizeReport(report);
      const statusLabel = REPORT_STATUS[(norm.status || "").toUpperCase()] || "상태";
      setDetailReport({ ...norm, statusLabel });
      setDetailOpen(true);
    };

    const closeDetail = () => {
      setDetailOpen(false);
      setDetailReport(null);
    };

    // 👇 삭제 핸들러
    const handleDeleteFromDetail = report => {
      if (!report?.reportId) {
        Alert.alert("오류", "삭제할 신고 정보를 찾을 수 없습니다.");
        return;
      }

      const idStr = String(report.reportId || "");
      const isLocalOnly = idStr.startsWith("temp-") || idStr.startsWith("mock-seed-");

      Alert.alert("삭제", "이 신고를 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            if (isLocalOnly) {
              setFlags(prev => prev.filter(r => r.reportId !== report.reportId));
              setDetailOpen(false);
              setDetailReport(null);
              setToast("임시 신고 내역이 삭제되었습니다");
              setTimeout(() => setToast(""), 2000);
              return;
            }

            try {
              const res = await http(
                `${API_BASE}/api/trash/${report.reportId}`,
                { method: "DELETE" },
                { timeout: 8000, retries: 0 },
              );
              if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
              }

              setFlags(prev => prev.filter(r => r.reportId !== report.reportId));
              setDetailOpen(false);
              setDetailReport(null);

              if (region) safeFetchFlags(region);

              setToast("신고가 삭제되었습니다");
              setTimeout(() => setToast(""), 2000);
            } catch (e) {
              console.log("[delete report] error", e);
              Alert.alert(
                "오류",
                "서버에서 신고 삭제 중 문제가 발생했습니다.\n잠시 후 다시 시도해주세요.",
              );
              if (region) safeFetchFlags(region);
            }
          },
        },
      ]);
    };

    useEffect(() => {
      return () => {
        try {
          fetchAbortRef.current?.abort();
        } catch {}
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, []);

    return (
      <View style={{ flex: 1, backgroundColor: GREEN_LIGHT }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 18,
            paddingBottom: 8,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "800", color: INK }}>BARO GREEN</Text>
        </View>
        
        {/* 지도 + 마커/콜아웃 */}
        <MapSection
          region={region}
          mapRef={mapRef}
          googleMapStyle={googleMapStyle}
          onRegionChangeComplete={onRegionChangeComplete}
          onMapPress={handleMapPress}
          markers={visibleMarkers}
          trackMarkerViews={trackMarkerViews}
          markerColors={MARKER_COLOR}
          statusLabelMap={REPORT_STATUS}
          getDisplayPhoto={getDisplayPhoto}
          onMarkerPress={handleMarkerPress}
          onOpenDetail={openDetail}
          onOpenSheet={f => {
            if (f?.lat && f?.lng) {
              setSelectedCenter({ lat: f.lat, lng: f.lng, address: f.address || "" });
            }
            openSheetToHalf();
          }}
        />

        {/* 상단 필터칩 */}
        <FilterChips value={filterStatus} onChange={setFilterStatus} />

        {/* 신고/버리기 FAB & 좌측 이동 버튼 */}
        <FloatingButtons
          GREEN_DARK={GREEN_DARK}
          GREEN_BORDER={GREEN_BORDER}
          INK={INK}
          onOpenReport={() => {
            setSubmitting(false);
            setReportOpen(true);
            Animated.timing(sheetHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start(() => setSheetOpen(false));
          }}
          onOpenDispose={() => {
            if (isGuest) {
              Alert.alert("안내", "회원가입 후 이용 가능합니다.");
              return;
            }
            setDisposeOpen(true);
          }}
          onMoveToMyLocation={moveToMyLocation}
          onMoveToAll={() => mapRef.current?.animateToRegion(KOREA_INITIAL_REGION, 600)}
        />

        {/* 하단 탭바 */}
        <BottomTabBar
          active="home"
          onPressHome={() => {}}
          onPressCommunity={() =>
            navigation.reset({ index: 0, routes: [{ name: "CommunityScreen" }] })
          }
          onPressLaw={() =>
            navigation.reset({ index: 0, routes: [{ name: "FirstAidGuideScreen" }] })
          }
          onPressMyPage={() =>
            navigation.reset({ index: 0, routes: [{ name: "MyPageScreen" }] })
          }
        />

        {/* 알림 FAB */}
        <TouchableOpacity
           onPress={openNotificationModal}
          style={styles.notifFab}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="notifications-outline" size={22} color={INK} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 신고 모달 */}
        <ReportModal
          visible={reportOpen}
          photo={photo}
          photoCoord={photoCoord}
          photoAddress={photoAddress}
          note={note}
          canSubmit={!!photo && (!!photoCoord || !!pos)}
          submitting={submitting}
          onClose={() => {
            setSubmitting(false);
            setReportOpen(false);
            setPhoto(null);
            setPhotoCoord(null);
            setPhotoAddress("");
            setNote("");
          }}
          onPickImage={pickImage}
          onChangeNote={setNote}
          onSubmit={submitReport}
        />

        {/* 버리기 모달 */}
        <DisposalModal
          visible={disposeOpen}
          category={dCategory}
          onChangeCategory={setDCategory}
          photo={dPhoto}
          photoCoord={dPhotoCoord}
          photoAddress={dPhotoAddress}
          note={dNote}
          canSubmit={!!dCategory && !!dPhoto && (!!dPhotoCoord || !!pos)}
          submitting={dSubmitting}
          onClose={() => {
            setDisposeOpen(false);
            setDCategory("");
            setDNote("");
            setDPhoto(null);
            setDPhotoCoord(null);
            setDPhotoAddress("");
            setDSubmitting(false);
          }}
          onPickImage={pickImageForDispose}
          onChangeNote={setDNote}
          onSubmit={submitDispose}
        />

        {/* 상세 모달 */}
        <DetailModal
          visible={detailOpen}
          report={detailReport}
          onClose={closeDetail}
          onDelete={handleDeleteFromDetail}
        />

        {/* 주변 민원 시트 */}
        <ReportSheet
          open={sheetOpen}
          sheetHeight={sheetHeight}
          onClose={() =>
            Animated.timing(sheetHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start(() => setSheetOpen(false))
          }
          onExpand={() =>
            Animated.timing(sheetHeight, {
              toValue: SHEET_MAX,
              duration: 220,
              useNativeDriver: false,
            }).start()
          }
          selectedCenter={selectedCenter}
          list={categorized}
          counts={categorized.counts}
          filterValue={filterStatus}
          onChangeFilter={setFilterStatus}
          getDisplayPhoto={getDisplayPhoto}
          onOpenDetail={openDetail}
        />

        {/* 알림 리스트 모달 */}
        <Modal
          visible={notifOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setNotifOpen(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 420,
                maxHeight: "70%",
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800" }}>알림</Text>
                <TouchableOpacity onPress={() => setNotifOpen(false)}>
                  <Text style={{ fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView>
                {notifications.length === 0 ? (
                  <Text style={{ paddingVertical: 12, color: "#6b7280" }}>
                    아직 도착한 알림이 없습니다.
                  </Text>
                ) : (
                  notifications.map(n => (
                    <TouchableOpacity
                      key={n.id}
                      onPress={() => {
                        Alert.alert("알림", n.message || "알림 내용을 불러올 수 없습니다.");
                      }}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: "#e5e7eb",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#111827",
                          fontWeight: n.read ? "400" : "700",
                        }}
                      >
                        {n.message}
                      </Text>
                      <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleString("ko-KR") : ""}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {!!toast && (
          <View
            style={{
              position: "absolute",
              top: 60,
              alignSelf: "center",
              backgroundColor: GREEN_DARK,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>{toast}</Text>
          </View>
        )}

        {/* ✅ 첫 진입 안내 문구 (5초 동안만 표시) */}
        {guideVisible && (
          <View
            style={{
              position: "absolute",
              top: 135,
              alignSelf: "center",
              backgroundColor: "rgba(46,179,111,0.95)",
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 999,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {/* 안내 문구 텍스트는 필요하면 다시 추가 */}
          </View>
        )}
      </View>
    );
  }

  const styles = StyleSheet.create({
    // 알림 버튼: 오른쪽 아래 플로팅 (내 위치 버튼 위 한 칸)
    notifFab: {
      position: "absolute",
      right: 25,
      bottom: 300,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#ffffff",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    notifBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    notifBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
      // ✅ 새 알림 배너 스타일
  notifBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FEF9C3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifBannerText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  notifBannerAction: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
  },
});
