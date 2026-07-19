// app/screens/CompanyLoginScreen.js
import React, { useState } from "react";
import { View, Alert, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";

export default function CompanyLoginScreen({ navigation }) {
  const [id, setId] = useState("barogreen");
  const [pw, setPw] = useState("1234");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);

    const ok = id.trim() === "barogreen" && pw.trim() === "1234";
    if (!ok) {
      setBusy(false);
      Alert.alert("로그인 실패", "아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    navigation.replace("CompanyMapScreen", {
      company: { name: "바로그린", id: "C001" },
    });
  };

  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("LoginScreen");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* StartScreen과 동일한 상단 소프트 장식 */}
      <View style={styles.heroBlob} />
      <View style={styles.heroBlob2} />

      <BackButton goBack={safeGoBack} style={styles.backBtn} />

      {/* 중앙 타이틀 + 폼 카드 */}
      <View style={styles.center}>
        <Text style={styles.title}>BARO GREEN</Text>
        <Text style={styles.subtitle}>업체 로그인</Text>

        <View style={styles.formCard}>
          <View style={{ gap: 12 }}>
            <TextInput
              label="아이디"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="비밀번호"
              value={pw}
              onChangeText={setPw}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <Button
            mode="contained"
            onPress={submit}
            disabled={busy}
            style={styles.btnPrimary}
            labelStyle={styles.btnPrimaryLabel}
          >
            {busy ? "처리 중..." : "로그인"}
          </Button>

          <View style={styles.row}>
            <Text style={{ color: "#4B5563" }}>일반 사용자 로그인으로 돌아가기</Text>
            <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
              <Text style={styles.link}> 이동</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ===== 디자인 토큰 (Start/Login/Register와 일치) ===== */
const GREEN = "#34D399"; // emerald-400
const GREEN_DARK = "#10B981"; // emerald-500
const GREEN_FADE = "#E9F9F0"; // 연녹 장식
const BG = "#F7FAF5"; // 거의 화이트
const BORDER_MUTE = "#E7EEF2";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // 상단 소프트 장식
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

  backBtn: { marginTop: 4, marginLeft: 8 },

  center: {
    flex: 1,
    justifyContent: "center", // ✅ 세로 중앙
    alignItems: "center", // ✅ 가로 중앙
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: GREEN_DARK,
    letterSpacing: 0.6,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "700",
    color: GREEN_DARK,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: 10,
  },

  formCard: {
    width: "92%",
    maxWidth: 560,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: BORDER_MUTE,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    gap: 12,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },

  btnPrimary: {
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    marginTop: 8,
    shadowColor: GREEN_DARK,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btnPrimaryLabel: { fontSize: 16.5, fontWeight: "800", letterSpacing: 0.2 },

  row: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  link: { fontWeight: "bold", color: GREEN_DARK },
});
