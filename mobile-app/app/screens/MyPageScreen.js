// app/screens/MyPageScreen.js
import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  PanResponder,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GREEN_DARK, GREEN_LIGHT, GREEN_BORDER, INK } from "../constants/homeTheme";
import { UserContext } from "../context/UserContext";
import BottomTabBar from "../components/common/BottomTabBar";
import { getSplitByType } from "../core/reportCache";
import { getBus } from "../utils/bus";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/* ───────────── 유틸 ───────────── */
function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt || "");
  }
}

/* 항목 네비 버튼(아이콘 + 라벨 + >) */
function NavRow({ icon, label, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.navRow, disabled && { opacity: 0.45 }]}
      activeOpacity={0.85}
    >
      <View style={styles.navIconBox}>{icon}</View>
      <Text style={styles.navLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#9AA5A1" />
    </TouchableOpacity>
  );
}

/* ───────────── 메인 ───────────── */
export default function MyPageScreen({ navigation }) {
  // ───────────── 스와이프 제스처 ─────────────
  const SWIPE_THRESHOLD = 40;

  // 마이페이지에서 왼쪽 스와이프 → 법규 안내로 이동
  const goToLaw = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "FirstAidGuideScreen" }] });
  }, [navigation]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 && Math.abs(gesture.dy) < 20,
      onPanResponderRelease: (_, gesture) => {
        // 왼쪽으로 충분히 스와이프 했을 때만 동작
        if (gesture.dx > SWIPE_THRESHOLD) {
          goToLaw();
        }
      },
    }),
  ).current;

  const { user, setUser } = useContext(UserContext);
  const isGuest = !user || user?.guest === true;

  const insets = useSafeAreaInsets();

  const accountId =
    user?.email ||
    user?.loginId ||
    user?.nickname ||
    user?.username ||
    (user?.id != null ? String(user.id) : "");

  // ✅ HomeScreen과 동일한 규칙으로 reporterId 계산 (게스트는 "guest")
  // const reporterId = isGuest ? "guest" : accountId || "";

  // ✅ 마이페이지용: 샘플/임시/게스트 여부만 판단 (회원 신고는 다 살림)
  function isValidForMyPageItem(r, reporterId, isGuest) {
    const rawId = r.reportId ?? r.id ?? "";
    const idStr = String(rawId || "");

    // 0) 샘플/임시 텍스트 제거
    const textBundle = [
      r.address,
      r.addr,
      r.note,
      r.category,
      r.trashType,
      r.trashTypeLabel,
      r.title,
    ]
      .filter(Boolean)
      .join(" ");
    if (textBundle.includes("임시")) return false;

    // 1) 서버에 실제로 저장되지 않은 임시/모크 데이터 제거
    if (!rawId) return false;
    if (idStr.startsWith("temp-") || idStr.startsWith("mock-")) return false;
    if (r.isTemp || r.localOnly || r.__offline || r.isMock || r.mock) return false;

    // 2) 신고자 식별
    const owner =
      r.reporterId ||
      r.memberLoginId ||
      r.member_login_id ||
      r.memberNickname ||
      r.nickname ||
      r.userId ||
      "";
    const ownerStr = String(owner || "")
      .trim()
      .toLowerCase();

    // 3) 이 신고가 "게스트 신고"인지 최대한 넓게 추정
    const isGuestReport =
      r.isGuestReport === true ||
      r.isGuest === true ||
      r.guest === true ||
      r.guestReport === true ||
      r.reporterType === "GUEST" ||
      ownerStr === "guest";

    // 4) 현재 로그인 상태에 따라 필터링
    if (isGuest) {
      // 비회원: 게스트 신고만 보여줌
      return isGuestReport;
    } else {
      // 회원: 게스트 신고만 숨기고 나머지는 다 보여줌
      if (isGuestReport) return false;
      return true;
    }
  }

  // ✅ HomeScreen과 동일한 규칙으로 reporterId 계산
  const rawReporterId =
    user?.loginId ||
    user?.nickname ||
    user?.username ||
    user?.email ||
    (user?.id != null ? String(user.id) : "");
  const reporterId = isGuest ? "guest" : rawReporterId || "";

  const onLogout = () => {
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
  };

  // 로컬 캐시 갱신(상단의 “나의 내역 n건” 표시에만 사용)
  const [loading, setLoading] = useState({ reports: false, payments: false });
  const [reportsCount, setReportsCount] = useState({ report: 0, disposal: 0 });

  const pullFromCache = useCallback(() => {
    setLoading(prev => ({ ...prev, reports: true }));
    const { reportsOnly, disposalsOnly } = getSplitByType({ guest: isGuest, reporterId });

    const filterList = list =>
      (list || []).filter(r => isValidForMyPageItem(r, reporterId, isGuest));

    const myReports = filterList(reportsOnly);
    const myDisposals = filterList(disposalsOnly);

    setReportsCount({
      report: myReports.length,
      disposal: myDisposals.length,
    });

    setLoading(prev => ({ ...prev, reports: false }));
  }, [isGuest, reporterId]);

  useEffect(() => {
    pullFromCache();
    const off1 = getBus().on("REPORTS_UPDATED", pullFromCache);
    const off2 = getBus().on("HISTORY_UPDATED", pullFromCache);
    return () => {
      try {
        off1 && off1();
        off2 && off2();
      } catch {}
    };
  }, [pullFromCache]);

  const totalMy = useMemo(() => reportsCount.report + reportsCount.disposal, [reportsCount]);

  const openHistory = mode => {
    if (mode === "disposal" && isGuest) {
      Alert.alert("안내", "회원가입 후 이용하실 수 있습니다.");
      return;
    }
    navigation.navigate("HistoryListScreen", { mode }); // ✅ 새 화면으로 이동
  };

  return (
    <>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.wrap, { paddingBottom: 120 }]}
        {...panResponder.panHandlers}
      >
        {/* 커뮤니티와 동일한 헤더 */}
        <View style={styles.header}>
          <View style={{ width: 22 }} />
          <Text style={styles.headerTitle}>마이페이지</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 10 }}
        >
          {/* 게스트 안내 배너 */}
          {isGuest && (
            <View style={styles.guestBanner}>
              <Text style={styles.guestText}>비회원은 신고 내역만 확인 가능합니다</Text>
            </View>
          )}

          {/* 계정 */}
          <View style={styles.card}>
            <Text style={styles.heading}>계정</Text>
            <Text style={styles.rowText}>{user?.email || "비회원"}</Text>
          </View>

          {/* 나의 접수 내역 (버튼 2개) */}
          <View style={styles.card}>
            <Text style={styles.heading}>나의 접수 내역</Text>
            <NavRow
              label="버리기 내역"
              onPress={() => openHistory("disposal")}
              disabled={isGuest}
              icon={<MaterialCommunityIcons name="delete-circle-outline" size={18} color={INK} />}
            />
            <NavRow
              label="신고 내역"
              onPress={() => openHistory("report")}
              icon={<MaterialCommunityIcons name="bookmark-check-outline" size={18} color={INK} />}
            />
          </View>

          {/* 결제 내역(샘플 자리 - 기존 그대로) */}
          {!isGuest && (
            <View style={styles.card}>
              <Text style={styles.heading}>결제 내역</Text>
              <NavRow
                label="결제 내역 보기"
                onPress={() => navigation.navigate("PaymentHistoryScreen")}
                icon={
                  <MaterialCommunityIcons name="credit-card-check-outline" size={18} color={INK} />
                }
              />
            </View>
          )}

          {/* 설정 */}
          <View style={styles.card}>
            <Text style={styles.heading}>설정</Text>
            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowText}>알림 설정</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.row}>
              <Text style={styles.rowText}>개인정보 처리방침</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>로그아웃</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* 탭바 */}
      <BottomTabBar
        active="mypage"
        onPressHome={() => navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] })}
        onPressCommunity={() =>
          navigation.reset({ index: 0, routes: [{ name: "CommunityScreen" }] })
        }
        onPressLaw={() => navigation.reset({ index: 0, routes: [{ name: "FirstAidGuideScreen" }] })}
        onPressMyPage={() => {}}
      />
    </>
  );
}

/* ───────────── 스타일 ───────────── */
const MINT_SOFT = "#E9F6EE";
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#FFFFFF" },

  /* 커뮤니티와 동일한 헤더 */
  header: {
    // ✅ 풀폭 흰색 헤더
    paddingHorizontal: 16,
    paddingVertical: 12,
    //paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
    marginBottom: 10,
    // borderTopLeftRadius: 12, // 배경색 전환 경계 자연스럽게
    // borderTopRightRadius: 12,
  },
  backHit: { padding: 6, borderRadius: 10 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: GREEN_DARK },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  heading: { fontSize: 15, fontWeight: "800", color: INK, marginBottom: 8 },

  navRow: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  navIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F2F7F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  navLabel: { flex: 1, fontSize: 15, color: "#1f1f1f", fontWeight: "700" },

  row: { paddingVertical: 12 },
  rowText: { color: "#333", fontSize: 14 },

  empty: { color: "#7f8f84", fontSize: 13, paddingVertical: 8 },

  logoutBtn: {
    marginTop: 8,
    backgroundColor: GREEN_DARK,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },

  guestBanner: {
    backgroundColor: MINT_SOFT,
    borderColor: GREEN_BORDER,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  guestText: { color: INK, fontWeight: "800", textAlign: "center" },
});
