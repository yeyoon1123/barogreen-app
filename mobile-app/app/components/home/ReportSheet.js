// app/components/home/ReportSheet.js
import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import {
  GREEN_LIGHT,
  GREEN_BORDER,
  GREEN_DARK,
  INK,
  REPORT_STATUS,
  MARKER_COLOR,
} from "../../constants/homeTheme";

const { height: SCREEN_H } = Dimensions.get("window");

export default function ReportSheet({
  open,
  sheetHeight,
  onClose,
  onExpand,
  selectedCenter,
  list,
  counts,
  filterValue,
  onChangeFilter,
  getDisplayPhoto,
  onOpenDetail, // ✅ 상세 열기 콜백
}) {
  const SHEET_MIN = Math.round(SCREEN_H * 0.28);
  const SHEET_MAX = Math.round(SCREEN_H * 0.72);

  const pan = useRef(new Animated.Value(0)).current;
  const startHeightRef = useRef(SHEET_MIN);

  const panResponder = useRef(
    PanResponder.create({
      // ✅ 아주 작은/빠른 제스처도 인식: '툭' 올려도 시작
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) >= 2 ||
        Math.abs(g.vy) >= 0.2 || // 속도/미세이동 허용
        (Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) >= 2),
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) >= 2 || Math.abs(g.vy) >= 0.2,

      onPanResponderGrant: () => {
        startHeightRef.current = sheetHeight._value ?? SHEET_MIN;
      },

      onPanResponderMove: (_, g) => {
        const nextRaw = startHeightRef.current - g.dy; // 위로 끌면 커짐
        const next = Math.min(SHEET_MAX, Math.max(SHEET_MIN, nextRaw));
        sheetHeight.setValue(next);
        pan.setValue(g.dy);
      },

      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => false,

      onPanResponderRelease: (_, g) => {
        const current = sheetHeight._value ?? SHEET_MIN;

        // ✅ 1) '짧게 툭' 위로 스와이프면 바로 MAX로
        const wasAtMin = startHeightRef.current <= SHEET_MIN + 8;
        const QUICK_EXPAND = g.dy <= -6 || g.vy <= -0.1; // 아주 작은 위동작/속도도 인정
        if (wasAtMin && QUICK_EXPAND) {
          Animated.spring(sheetHeight, {
            toValue: SHEET_MAX,
            useNativeDriver: false,
          }).start();
          return;
        }

        // ✅ 2) 일반 플릭: 위로 빠르게면 MAX
        const EXPAND_DISTANCE = -60;
        const EXPAND_VELOCITY = -0.9;
        if (g.dy < EXPAND_DISTANCE || g.vy < EXPAND_VELOCITY) {
          Animated.spring(sheetHeight, {
            toValue: SHEET_MAX,
            useNativeDriver: false,
          }).start();
          return;
        }

        // ✅ 3) 의도적인 아래로 닫기만 허용
        const CLOSE_DISTANCE = 100;
        const CLOSE_VELOCITY = 1.2;
        if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_VELOCITY) {
          Animated.timing(sheetHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start(onClose);
          return;
        }

        // ✅ 4) 스냅
        const snap =
          Math.abs(current - SHEET_MIN) < Math.abs(current - SHEET_MAX) ? SHEET_MIN : SHEET_MAX;

        Animated.spring(sheetHeight, {
          toValue: snap,
          useNativeDriver: false,
        }).start();
      },
    }),
  ).current;

  if (!open) return null;

  const badges = [
    { key: "ALL", text: "전체", count: list.all.length, color: GREEN_DARK },
    {
      key: "completed",
      text: REPORT_STATUS.COMPLETED,
      count: counts.completed,
      color: MARKER_COLOR.COMPLETED,
    },

    {
      key: "pending",
      text: REPORT_STATUS.PENDING,
      count: counts.pending,
      color: MARKER_COLOR.PENDING,
    },
  ];

  const current = (filterValue === "ALL" ? list.all : list[filterValue]) || [];

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
      {/* ✅ 드래그 가능한 범위: 손잡이 + 헤더 전체 */}
      <View style={styles.dragArea} {...panResponder.panHandlers}>
        <View style={styles.handle}>
          <View style={styles.handleBar} />
        </View>

        {/* ✅ 패딩/정렬은 헤더 안에서만 */}
        <View style={styles.header}>
          <Text style={styles.title}>주변 민원 현황(반경 10km)</Text>
          <Text style={styles.addr}>{selectedCenter?.address || "주소 정보 없음"}</Text>

          <View className="badgeRow" style={styles.badgeRow}>
            {badges.map(b => {
              const active = filterValue.toLowerCase() === b.key.toLowerCase();
              return (
                <TouchableOpacity
                  key={b.key}
                  onPress={() => onChangeFilter(b.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.badge,
                    {
                      borderColor: b.color,
                      backgroundColor: active ? "rgba(16,185,129,0.10)" : "#fff",
                    },
                  ]}
                >
                  <View style={[styles.dot, { backgroundColor: b.color }]} />
                  <Text style={[styles.badgeText, active && { color: INK, fontWeight: "800" }]}>
                    {b.text} {b.count}건
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listWrap}>
        {current.map(r => (
          <View key={r.reportId} style={styles.item}>
            <Text style={styles.itemText}>📍 {(r.address || "근처").toString().slice(0, 40)}</Text>
            <Text style={styles.itemStatus}>{REPORT_STATUS[r.status.toUpperCase()]}</Text>

            {/* ✅ 사진 터치 → 상세 열기 */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => onOpenDetail && onOpenDetail(r)}>
              <Image source={{ uri: getDisplayPhoto(r) }} style={styles.photo} />
            </TouchableOpacity>

            <Text style={styles.itemNote}>
              특이사항: {r.note || "없음"}
              {r.trashType || r.trashTypeLabel ? ` · 종류: ${r.trashTypeLabel || r.trashType}` : ""}
            </Text>

            <Text style={styles.itemTime}>신고일시: {new Date(r.reportedAt).toLocaleString()}</Text>
          </View>
        ))}
        {current.length === 0 && <Text style={styles.noReport}>민원 내역이 없습니다.</Text>}
      </ScrollView>

      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>닫기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expandBtn} onPress={onExpand}>
          <Text style={styles.expandText}>위로 더 보기</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({ android: { elevation: 6 } }),
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    overflow: "hidden",
  },

  /* ✅ 드래그 영역(손잡이 + 헤더 전체) */
  dragArea: {
    paddingBottom: 6,
    backgroundColor: "#fff",
  },

  handle: { paddingVertical: 10, alignItems: "center" },
  handleBar: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: GREEN_BORDER,
  },

  /* ✅ 좌우 패딩/정렬을 헤더에만 부여 */
  header: { paddingHorizontal: 16, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "800", color: INK },
  addr: { fontSize: 13, color: "#6b7c70" },

  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: "700", color: INK },

  listWrap: { paddingBottom: 80, paddingHorizontal: 16 },

  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GREEN_BORDER,
  },
  itemText: { fontSize: 14, fontWeight: "600", color: "#1f1f1f" },
  itemStatus: {
    fontSize: 12,
    color: GREEN_DARK,
    marginTop: 4,
    fontWeight: "bold",
  },
  photo: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginVertical: 6,
    backgroundColor: "#eee",
  },
  itemNote: { fontSize: 12, color: "#555", marginTop: 4 },
  itemTime: { fontSize: 11, color: "#6b7c70", marginTop: 2 },
  noReport: { color: "#7f8f84", fontSize: 13, textAlign: "center", paddingVertical: 10 },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    alignItems: "center",
  },
  closeText: { fontWeight: "800", color: GREEN_DARK },
  expandBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
  },
  expandText: { fontWeight: "800", color: GREEN_DARK },
});
