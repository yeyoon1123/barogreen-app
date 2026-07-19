// 신고/버리기 FAB: + 버튼으로 확장/접기
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

export default function FloatingButtons({
  GREEN_DARK,
  GREEN_BORDER,
  INK,
  onOpenReport,
  onOpenDispose, // ✅ 버리기 모달 열기
  onMoveToMyLocation,
  onMoveToAll,
}) {
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(anim, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  // 애니메이션 파생값 (오른쪽으로 펼치기)
  const reportTx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -76] }); // 신고
  const disposeTx = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -152] }); // 버리기
  const itemsOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const plusRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] });

  return (
    <>
      {/* 펼쳐졌을 때 배경 터치로 닫기 */}
      {expanded && <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />}

      {/* 좌측 이동 버튼들 (그대로) */}
      <View style={styles.leftBtnsWrap}>
        <TouchableOpacity
          style={[styles.smallBtn, { borderColor: GREEN_BORDER }]}
          onPress={onMoveToMyLocation}
        >
          <Text style={[styles.smallBtnText, { color: INK }]}>내 위치</Text>
        </TouchableOpacity>

        {/* 필요 시 활성화 */}
        {/* <TouchableOpacity
          style={[styles.smallBtn, { borderColor: GREEN_BORDER, marginLeft: 8 }]}
          onPress={onMoveToAll}
        >
          <Text style={[styles.smallBtnText, { color: INK }]}>전체 지도</Text>
        </TouchableOpacity> */}
      </View>

      {/* 확장된 항목 - 버리기 */}
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        style={[
          styles.fab,
          {
            right: 16,
            bottom: 200,
            backgroundColor: GREEN_DARK,
            transform: [{ translateX: disposeTx }],
            opacity: itemsOpacity,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            toggle();
            onOpenDispose?.();
          }}
          style={styles.fullStretch}
        >
          <Text style={styles.fabText}>버리기</Text>
        </Pressable>
      </Animated.View>

      {/* 확장된 항목 - 신고 */}
      <Animated.View
        pointerEvents={expanded ? "auto" : "none"}
        style={[
          styles.fab,
          {
            right: 16,
            bottom: 200,
            backgroundColor: GREEN_DARK,
            transform: [{ translateX: reportTx }],
            opacity: itemsOpacity,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            toggle();
            onOpenReport?.();
          }}
          style={styles.fullStretch}
        >
          <Text style={styles.fabText}>신고</Text>
        </Pressable>
      </Animated.View>

      {/* 메인 + 버튼 */}
      <Pressable
        style={[styles.fab, { right: 16, bottom: 200, backgroundColor: GREEN_DARK }]}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={expanded ? "작업 닫기" : "작업 열기"}
      >
        <Animated.Text style={[styles.plusText, { transform: [{ rotate: plusRotate }] }]}>
          +
        </Animated.Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
  },
  fabText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  plusText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 28,
    lineHeight: 28,
    marginTop: 2,
  },
  fullStretch: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  leftBtnsWrap: {
    position: "absolute",
    left: 16,
    bottom: 200,
    flexDirection: "row",
  },
  smallBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({ android: { elevation: 2 } }),
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  smallBtnText: { fontWeight: "700" },
});
