// app/screens/ResetPasswordScreen.js
import React, { useState } from "react";
import { View, StyleSheet, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import BackButton from "../components/BackButton";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { emailValidator } from "../helpers/emailValidator";
import { API_BASE } from "../core/config";

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState({ value: "", error: "" });
  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(false);

  /** 인증코드 전송 */
  const sendResetPasswordEmail = async () => {
    const trimmed = email.value.trim();
    const emailError = emailValidator(trimmed);
    if (emailError) {
      setEmail({ value: trimmed, error: emailError });
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/api/email/send-code?email=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { method: "POST" });

      if (res.status === 404) {
        Alert.alert("계정 없음", "등록된 계정이 아닙니다.");
        return;
      }
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        Alert.alert("오류", msg || `코드 전송 실패 (HTTP ${res.status})`);
        return;
      }

      Alert.alert("이메일 전송 완료", "입력하신 이메일로 인증코드를 보냈습니다.");
      setShowCodeInput(true);
    } catch (e) {
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  /** 코드 검증 → 새 비밀번호 화면으로 */
  const verifyCodeAndContinue = async () => {
    const trimmedEmail = email.value.trim();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      Alert.alert("오류", "인증코드를 입력하세요.");
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/api/email/verify-code?email=${encodeURIComponent(
        trimmedEmail,
      )}&code=${encodeURIComponent(trimmedCode)}`;
      const res = await fetch(url, { method: "POST" });

      let okBody = null;
      try {
        okBody = await res.json();
      } catch {
        const txt = await res.text().catch(() => "");
        okBody = txt === "true";
      }

      if (res.ok && okBody === true) {
        Alert.alert("성공", "인증이 완료되었습니다.");
        navigation.navigate("NewPasswordScreen", { email: trimmedEmail });
      } else {
        Alert.alert("실패", "인증코드가 일치하지 않습니다.");
      }
    } catch (e) {
      Alert.alert("네트워크 오류", "서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 뒤로가기: 스택이 없을 때도 안전
  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("StartScreen");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      {/* StartScreen과 동일한 상단 소프트 장식 */}
      <View style={styles.heroBlob} />
      <View style={styles.heroBlob2} />

      {/* 좌상단 뒤로가기 */}
      <BackButton goBack={safeGoBack} style={styles.backBtn} />

      {/* 중앙 타이틀 + 폼 카드 */}
      <View style={styles.center}>
        <Text style={styles.title}>BARO GREEN</Text>
        <Text style={styles.subtitle}>비밀번호 재설정</Text>

        <View style={styles.formCard}>
          <View style={{ gap: 12 }}>
            <TextInput
              label="이메일"
              returnKeyType="done"
              value={email.value}
              onChangeText={t => setEmail({ value: t, error: "" })}
              error={!!email.error}
              errorText={email.error}
              autoCapitalize="none"
              keyboardType="email-address"
              // 기존 컴포넌트가 description 지원하므로 유지
              description="비밀번호 재설정 인증코드가 이메일로 전송됩니다."
              style={styles.input}
            />

            {showCodeInput && (
              <TextInput
                label="인증 코드"
                returnKeyType="done"
                value={code}
                onChangeText={setCode}
                style={[styles.input, { marginTop: 4 }]}
              />
            )}
          </View>

          <Button
            mode="contained"
            onPress={showCodeInput ? verifyCodeAndContinue : sendResetPasswordEmail}
            disabled={loading}
            style={styles.btnPrimary}
            labelStyle={styles.btnPrimaryLabel}
          >
            {showCodeInput
              ? loading
                ? "확인 중..."
                : "확인"
              : loading
                ? "전송 중..."
                : "계속하기"}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ===== 디자인 토큰 (StartScreen/로그인/회원가입과 일치) ===== */
const GREEN = "#34D399"; // emerald-400
const GREEN_DARK = "#10B981"; // emerald-500
const GREEN_FADE = "#E9F9F0"; // 연녹 장식
const BG = "#F7FAF5"; // 거의 화이트
const BORDER_MUTE = "#E7EEF2";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

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

  /* 중앙 배치 */
  center: {
    flex: 1,
    justifyContent: "center", // ✅ 세로 중앙
    alignItems: "center", // ✅ 가로 중앙
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 36,
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

  /* 화이트 카드 */
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

  // 주 버튼 (StartScreen과 동일)
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
});
