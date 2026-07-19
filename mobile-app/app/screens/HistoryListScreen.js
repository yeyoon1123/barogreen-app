// app/screens/HistoryListScreen.js
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GREEN_LIGHT, GREEN_BORDER, INK, GREEN_DARK } from "../constants/homeTheme";
import { UserContext } from "../context/UserContext";
import { getSplitByType, findReportById } from "../core/reportCache";
import { getBus } from "../utils/bus";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import DetailModal from "../components/home/DetailModal";

/* ───────────── 유틸 ───────────── */
/* ───────────── 유틸 ───────────── */
// 신고/버리기에서 들어올 수 있는 모든 형태의 “접수 사진” 키 커버
function safePhoto(r) {
  return r?.photoUri || r?.photo_url || r?.photo || r?.imageUrl || r?.image_url || r?.image || "";
}

// 완료 사진(처리 후 사진) 키들 커버
function safeCompletedPhoto(r) {
  return (
    r?.completedPhoto ||
    r?.completed_photo ||
    r?.afterImage ||
    r?.after_image ||
    r?.completedImage ||
    r?.completedImageUrl ||
    r?.completed_image_url ||
    ""
  );
}

function getReporterLabel(r = {}) {
  const raw =
    (r.reporterId || r.memberLoginId || r.member_login_id || r.memberNickname || r.nickname || "") +
    "";

  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "guest") return "비회원";
  return trimmed;
}

function normalizeItem(r = {}) {
  const rawStatus = String(r.status || r.statusLabel || r.state || "pending").toLowerCase();
  let status = rawStatus;
  if (["completed", "complete", "done", "처리완료"].includes(rawStatus)) status = "completed";
  else if (["pending", "inprogress", "접수완료", "접수", "진행중"].includes(rawStatus))
    status = "pending";

  const category = r.category || r.trashType || r.trashTypeLabel || "";
  const type = r.type || (category ? "disposal" : "report");

  const photoUri = safePhoto(r);
  const completedPhoto = safeCompletedPhoto(r);

  const id = r.reportId ?? r.id ?? `temp-${Math.random()}`;
  const address = r.address || r.addr || "주소 정보 없음";

  const reporterLabel = getReporterLabel(r);

  return {
    // ✅ 원본 필드들 먼저 살리고
    ...r,

    // ✅ 그 위에 우리가 쓰는 표준 필드를 덮어쓰기
    id,
    reportId: id,
    address,
    note: r.note || "",
    status,
    type,
    category,
    trashType: category || r.trashType || "",
    trashTypeLabel: category || r.trashTypeLabel || "",
    photoUri,
    completedPhoto,
    reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),
    // ✅ 신고자 라벨 (비회원 / 계정)
    reporterLabel,
  };
}

// ✅ 마이페이지용: 임시데이터/다른 계정 데이터 제거
// ✅ 마이페이지/히스토리용 필터
// - 비회원: 이 폰에서 찍은 신고는 웬만하면 다 보여줌(진짜 모크/샘플만 제거)
// - 회원: 기존 로직 유지 (guest 데이터만 막음)
function isValidForMyPageItem(r, reporterId, isGuest) {
  const owner =
    r.reporterId ||
    r.memberLoginId ||
    r.member_login_id ||
    r.memberNickname ||
    r.nickname ||
    r.userId ||
    "";

  const rawId = r.reportId ?? r.id ?? "";
  const idStr = String(rawId || "");

  // 0) 공통: 텍스트에 "임시" 들어가면 샘플 데이터 → 숨김
  const textBundle = [r.address, r.addr, r.note, r.category, r.trashType, r.trashTypeLabel, r.title]
    .filter(Boolean)
    .join(" ");
  if (textBundle.includes("임시")) return false;

  // ───────── 비회원일 때 ─────────
  if (isGuest) {
    // 비회원은: 이 기기에서 찍은 건 거의 다 보여주고
    // 명시적으로 모크로 표시된 것만 막자
    if (r.isMock || r.mock) return false;
    return true;
  }

  // ───────── 회원일 때 ─────────
  // 회원에 대해서만 “rawId 없음 / temp / 로컬” 강하게 필터
  if (!rawId) return false;
  if (idStr.startsWith("temp-")) return false;
  if (r.isTemp || r.localOnly || r.__offline || r.isMock || r.mock) return false;

  // 회원 화면에서는 guest 신고는 숨기고 나머지만
  if (owner === "guest") return false;

  if (reporterId) {
    if (owner && owner !== reporterId) return false;
  } else {
    if (!owner) return false;
  }

  return true;
}

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt || "");
  }
}

/* ───────────── 메인 ───────────── */
export default function HistoryListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useContext(UserContext);
  const isGuest = !user || user?.guest === true;

  const rawReporterId =
    user?.loginId ||
    user?.nickname ||
    user?.username ||
    user?.email ||
    (user?.id != null ? String(user.id) : "");

  const reporterId = isGuest ? "guest" : rawReporterId || "";

  const initialMode = route.params?.mode === "disposal" ? "disposal" : "report";
  const [mode] = useState(initialMode); // 화면 진입 시 모드 고정
  const [statusTab, setStatusTab] = useState("pending"); // "pending" | "completed"
  const [items, setItems] = useState([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);

  // 비회원인데 혹시라도 disposal 모드로 들어오면 방어
  useEffect(() => {
    if (isGuest && mode === "disposal") {
      Alert.alert("안내", "비회원은 버리기 내역을 볼 수 없습니다.");
      navigation.goBack();
    }
  }, [isGuest, mode, navigation]);

  const title = useMemo(() => {
    if (mode === "disposal") return "버리기 내역";
    return "신고 내역";
  }, [mode]);

  const reload = useCallback(() => {
    // 🔹 내 계정 기준으로 split
    const { reportsOnly, disposalsOnly } = getSplitByType({
      guest: isGuest,
      reporterId,
    });

    const rawBase = mode === "disposal" ? disposalsOnly || [] : reportsOnly || [];
    // ✅ 마이페이지: 임시데이터 + 다른 계정(guest/회원 뒤섞인 것) 제거
    const base = rawBase.filter(r => isValidForMyPageItem(r, reporterId, isGuest));

    const normalized = base.map(normalizeItem).sort((a, b) => {
      const ta = new Date(a.reportedAt).getTime();
      const tb = new Date(b.reportedAt).getTime();
      return tb - ta; // 최근순
    });

    setItems(normalized);
  }, [isGuest, reporterId, mode]);

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailReport(null);
  };

  // 포커스마다 새로고침
  useFocusEffect(
    useCallback(() => {
      reload();
      const off1 = getBus().on("REPORTS_UPDATED", reload);
      const off2 = getBus().on("HISTORY_UPDATED", reload);
      return () => {
        try {
          off1 && off1();
          off2 && off2();
        } catch {}
      };
    }, [reload]),
  );

  // 상태별 분리: 접수중(접수완료) / 처리완료
  const { pendingList, completedList } = useMemo(() => {
    const completed = items.filter(i => i.status === "completed");
    const pending = items.filter(i => i.status !== "completed");
    return {
      pendingList: pending,
      completedList: completed,
    };
  }, [items]);

  const counts = useMemo(
    () => ({
      pending: pendingList.length,
      completed: completedList.length,
    }),
    [pendingList, completedList],
  );

  const showing = statusTab === "completed" ? completedList : pendingList;

  const handleOpenDetail = item => {
    if (!item) return;

    // 1) 최신 플래그(지도 쪽 상태)에서 한 번 더 가져오기
    const latest = findReportById(item.reportId || item.id) || findReportById(item.id) || item;

    // 2) 사진/상태를 최신 값 기준으로 재정리
    const merged = {
      ...latest,
      ...item, // 주소/노트 등은 리스트에서 정리한 값 우선
    };

    const full = {
      ...merged,
      photoUri: safePhoto(merged),
      completedPhoto: safeCompletedPhoto(merged),
      statusLabel: merged.status === "completed" ? "처리 완료" : "접수 완료",
    };

    setDetailReport(full);
    setDetailOpen(true);
  };

  const renderItem = ({ item }) => {
    const photo =
      statusTab === "completed" ? item.completedPhoto || safePhoto(item) : safePhoto(item);
    const isCompleted = item.status === "completed";

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() => handleOpenDetail(item)}
      >
        {/* 썸네일 */}
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={20} color="#9CA3AF" />
          </View>
        )}

        {/* 텍스트 영역 */}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isCompleted ? "#E5F2FF" : "#E9F6EE",
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isCompleted ? "#2563EB" : GREEN_DARK,
                  },
                ]}
              >
                {isCompleted ? "처리 완료" : "접수 완료"}
              </Text>
            </View>

            {mode === "disposal" && !!item.category && (
              <View style={[styles.badge, { backgroundColor: "#F5F5F5" }]}>
                <Text style={[styles.badgeText, { color: "#4B5563" }]}>{item.category}</Text>
              </View>
            )}
          </View>

          <Text style={styles.addr} numberOfLines={1}>
            {item.address}
          </Text>
          {!!item.note && (
            <Text style={styles.note} numberOfLines={1}>
              {item.note}
            </Text>
          )}
          <Text style={styles.time}>{fmt(item.reportedAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.wrap,
        { paddingBottom: 80 + (Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0) },
      ]}
      edges={["top", "left", "right"]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backHit} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* 비회원 안내 (신고 모드에서만) */}
      {isGuest && mode === "report" && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>비회원은 신고 내역만 확인할 수 있습니다</Text>
        </View>
      )}

      {/* 상태 탭: 접수중 / 처리완료 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, statusTab === "pending" && styles.tabBtnActive]}
          onPress={() => setStatusTab("pending")}
        >
          <Text style={[styles.tabText, statusTab === "pending" && styles.tabTextActive]}>
            접수완료 {counts.pending > 0 ? `(${counts.pending})` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, statusTab === "completed" && styles.tabBtnActive]}
          onPress={() => setStatusTab("completed")}
        >
          <Text style={[styles.tabText, statusTab === "completed" && styles.tabTextActive]}>
            처리완료 {counts.completed > 0 ? `(${counts.completed})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      {showing.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {statusTab === "pending"
              ? "현재 접수 완료된 내역이 없습니다."
              : "처리 완료된 내역이 없습니다."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={showing}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* 상세 모달 (홈과 동일) */}
      <DetailModal
        visible={detailOpen}
        report={detailReport}
        onClose={handleCloseDetail}
        onDelete={() => {}}
      />
    </SafeAreaView>
  );
}

/* ───────────── 스타일 ───────────── */
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
  },
  backHit: {
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: GREEN_DARK,
  },
  guestBanner: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: "#E9F6EE",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  guestText: {
    color: INK,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  tabBtnActive: {
    backgroundColor: "#E9F6EE",
    borderColor: GREEN_DARK,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: GREEN_DARK,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    padding: 10,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  addr: {
    fontSize: 13,
    fontWeight: "700",
    color: INK,
  },
  note: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 1,
  },
  time: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 3,
  },
  reporterText: {
    marginTop: 2,
    fontSize: 11,
    color: "#111111",
  },
});
