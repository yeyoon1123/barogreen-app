// app/screens/FirstAidGuideScreen.js
import React, { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomTabBar from "../components/common/BottomTabBar";

/* ===== Soft Brand Palette (채도↓, 대비↓) ===== */
const EMERALD = "#10B981"; // 기본 브랜드 그린
const TEAL_DARK = "#0F766E"; // 제목에 쓰는 차분한 틸
const BG = "#F7FAF5"; // 라이트 배경
const BLOB_FADE_1 = "#ECFDF5"; // 부드러운 상단 장식
const BLOB_FADE_2 = "#E6FEF7";
const INK = "#4B5563"; // 본문
const BORDER = "#E7EEF2"; // 카드 경계(연함)

export default function FirstAidGuideScreen({ navigation }) {
  const SWIPE_THRESHOLD = 40;

  const goPrev = () => {
    // 이전: 커뮤니티
    navigation.reset({ index: 0, routes: [{ name: "CommunityScreen" }] });
  };

  const goNext = () => {
    // 다음: 마이페이지
    navigation.reset({ index: 0, routes: [{ name: "MyPageScreen" }] });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          goNext();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          goPrev();
        }
      },
    }),
  ).current;
  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" />

        {/* 상단 소프트 장식 */}
        <View style={styles.heroBlob} />
        <View style={styles.heroBlob2} />

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관련 법규 & 안내</Text>
          <View style={styles.headerBadge}>
            <Ionicons name="shield-checkmark-outline" size={18} color={TEAL_DARK} />
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
          <GuideCard
            icon="alert-circle-outline"
            title="생활폐기물 불법투기 신고"
            lines={[
              "생활폐기물은 무단 투기 시 과태료가 부과될 수 있습니다.",
              "발견 시 사진·위치를 기록하여 관할 지자체 또는 본 앱의 신고 기능으로 접수하세요.",
            ]}
          />

          <GuideCard
            icon="cube-outline"
            title="대형폐기물 처리"
            lines={[
              "가구/가전 등 대형폐기물은 지자체 스티커 발급 또는 온라인 신고·수수료 결제 후 배출합니다.",
              "지역마다 세부 절차가 다를 수 있습니다.",
            ]}
          />

          <GuideCard
            icon="recycle-outline"
            title="재활용 분리배출 기본"
            bullets={[
              "플라스틱·캔·유리는 내용물을 비우고 배출",
              "종이는 테이프/스테이플 제거 후 규격 묶음",
              "음식물 쓰레기는 물기 제거 후 전용 용기",
            ]}
          />

          <GuideCard
            icon="information-circle-outline"
            title="유의사항"
            lines={[
              "실제 적용 법규·금액은 지역에 따라 상이할 수 있습니다.",
              "정확한 절차는 관할 지자체 홈페이지 또는 콜센터에서 확인하세요.",
            ]}
            last
          />
        </ScrollView>
      </SafeAreaView>

      {/* ✅ 하단 탭바 고정 */}
      <BottomTabBar
        active="law"
        onPressHome={() => navigation.navigate("HomeScreen")}
        onPressCommunity={() => navigation.navigate("CommunityScreen")}
        onPressLaw={() => {}}
        onPressMyPage={() => navigation.navigate("MyPageScreen")}
      />
    </View>
  );
}

/* ===== 가독성 좋은 카드 컴포넌트 ===== */
function GuideCard({ icon, title, lines = [], bullets = [], last = false }) {
  return (
    <View style={[styles.card, last && { marginBottom: 28 }]}>
      <View style={styles.cardHead}>
        <View style={styles.iconBadge}>
          <Ionicons name={icon} size={16} color={TEAL_DARK} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {lines.map((t, i) => (
        <Text key={`l-${i}`} style={styles.paragraph}>
          {t}
        </Text>
      ))}

      {bullets.length > 0 && (
        <View style={{ marginTop: lines.length ? 8 : 0 }}>
          {bullets.map((b, i) => (
            <View key={`b-${i}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* 상단 장식(경쾌하지만 연하게) */
  heroBlob: {
    position: "absolute",
    top: -140,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: BLOB_FADE_1,
  },
  heroBlob2: {
    position: "absolute",
    top: -100,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: BLOB_FADE_2,
    opacity: 0.75,
  },

  /* 상단 헤더 */
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEAL_DARK, // ✅ 강한 초록 대신 딥 틸
    letterSpacing: 0.2,
  },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.28)", // EMERALD with alpha
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  content: { paddingHorizontal: 16, paddingTop: 6 },

  /* 카드 */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 12,
    // 은은한 그림자
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.28)",
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: TEAL_DARK,
  },

  paragraph: {
    fontSize: 14,
    color: INK,
    lineHeight: 21,
    marginTop: 2,
  },

  /* 커스텀 불릿: 점 + 텍스트 간격 정교화 */
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 6 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
    backgroundColor: "rgba(16,185,129,0.45)",
  },
  bulletText: { flex: 1, fontSize: 14, color: INK, lineHeight: 21 },
});
