// app/screens/StartScreen.js
import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text as PaperText } from "react-native-paper";
import { FontAwesome as Icon } from "@expo/vector-icons";
import Button from "../components/Button";
import { theme } from "../core/theme";
import { UserContext } from "../context/UserContext";

export default function StartScreen({ navigation }) {
  // ===== 타이핑 애니메이션 =====
  const subtitleFull = "바로 그린에 오신 것을 환영합니다.";
  const [subtitleShown, setSubtitleShown] = useState("");
  const typingTimerRef = useRef(null);
  const { setUser } = useContext(UserContext);
  useEffect(() => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    let i = 0;
    const TYPE_SPEED = 85;
    typingTimerRef.current = setInterval(() => {
      setSubtitleShown(subtitleFull.slice(0, i + 1));
      i += 1;
      if (i >= subtitleFull.length) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    }, TYPE_SPEED);
    return () => typingTimerRef.current && clearInterval(typingTimerRef.current);
  }, []);

  // const startAsGuest = () => {
  //   navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
  // };

  const startAsGuest = () => {
    // ✅ 게스트 플래그 저장
    setUser({ guest: true, name: "게스트" });
    navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* 소프트 톤 배경 장식 */}
      <View style={styles.heroBlob} />
      <View style={styles.heroBlob2} />

      {/* 중앙 카피 */}
      <View style={styles.center}>
        <Text style={styles.title}>BARO GREEN</Text>
        <Text style={styles.subtitle}>{subtitleShown}</Text>
        <Text style={styles.caption}>
          내 주변 쓰레기 더미를 간편하게 신고하고, 처리 과정을 실시간으로 확인해 보세요.
        </Text>

        {/* 페이저 점 */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* 하단 액션 카드 */}
      <View style={styles.actionCard}>
        {/* 로그인 — Primary Filled (아이콘 포함) */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.92}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <View style={styles.primaryContent}>
            <Icon name="lock" size={18} style={styles.primaryIcon} />
            <Text style={styles.primaryLabel}>로그인</Text>
          </View>
          {/* 살짝 광택 느낌 오버레이 */}
          <View pointerEvents="none" style={styles.primarySheen} />
        </TouchableOpacity>

        {/* 비회원 — Tonal Filled */}
        <TouchableOpacity style={styles.guestBtn} activeOpacity={0.92} onPress={startAsGuest}>
          <View style={styles.guestContent}>
            <Icon name="user-o" size={18} style={styles.guestIcon} />
            <Text style={styles.guestLabel}>비회원으로 시작하기</Text>
          </View>
        </TouchableOpacity>

        {/* 회원가입 — Outlined */}
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("RegisterScreen")}
          style={[styles.btnBase, styles.btnOutlined]}
          labelStyle={styles.btnOutlinedLabel}
        >
          회원가입
        </Button>

        {/* 네이버(예시)
        <TouchableOpacity style={styles.socialButton} onPress={() => {}}>
          <View style={styles.socialContent}>
            <Icon name="search" size={18} style={styles.naverIcon} />
            <PaperText style={styles.socialLabel}>네이버로 시작하기</PaperText>
          </View>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}

/* ===== 디자인 토큰 ===== */
const GREEN = "#34D399"; // emerald-400
const GREEN_DARK = "#10B981"; // emerald-500
const GREEN_FADE = "#E9F9F0"; // 연녹 배경 장식
const BG = "#F7FAF5";
const INK = "#5B7285";
const BORDER_MUTE = "#E7EEF2";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // 장식
  heroBlob: {
    position: "absolute",
    top: -160,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: GREEN_FADE,
    opacity: 0.9,
  },
  heroBlob2: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#F0FFF7",
    opacity: 0.6,
  },

  // 중앙 카피
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 44,
    fontWeight: "800",
    color: GREEN_DARK,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: GREEN_DARK,
    opacity: 0.9,
    textAlign: "center",
    minHeight: 26,
  },
  caption: {
    marginTop: 12,
    maxWidth: 560,
    fontSize: 15.5,
    lineHeight: 23,
    color: INK,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  dots: { marginTop: 18, flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#DDE8DF" },
  dotActive: { backgroundColor: GREEN, width: 20, borderRadius: 10 },

  // 하단 카드
  actionCard: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 26,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: BORDER_MUTE,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    gap: 12,
  },

  // 공통 버튼 베이스
  btnBase: { height: 56, borderRadius: 18 },

  // 로그인 Primary(커스텀 Touchable로 통일)
  primaryBtn: {
    position: "relative",
    height: 56,
    borderRadius: 18,
    backgroundColor: GREEN,
    shadowColor: GREEN_DARK,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  primaryContent: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryIcon: { color: "#fff" },
  primaryLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  // 상단 광택
  primarySheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  // Guest Tonal
  guestBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F2FBF7",
    borderWidth: 1,
    borderColor: "#CFEFE2",
  },
  guestContent: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  guestIcon: { color: GREEN_DARK },
  guestLabel: { color: GREEN_DARK, fontSize: 16, fontWeight: "800" },

  // Outlined
  btnOutlined: {
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 18,
  },
  btnOutlinedLabel: {
    color: GREEN_DARK,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // 소셜
  socialButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_MUTE,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  socialContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialLabel: {
    marginLeft: 8,
    fontSize: 15.5,
    fontWeight: "800",
    color: theme.colors.secondary,
  },
  naverIcon: { color: "#03C75A" },
});
