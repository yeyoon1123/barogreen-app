// app/screens/NewPasswordScreen.js
import React, { useState } from "react";
import { View, StyleSheet, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import BackButton from "../components/BackButton";
import { passwordValidator } from "../helpers/passwordValidator";
import { API_BASE } from "../core/config";

export default function NewPasswordScreen({ navigation, route }) {
  const { email } = route.params;
  const [password, setPassword] = useState({ value: "", error: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const passwordError = passwordValidator(password.value);
    if (passwordError) {
      setPassword({ ...password, error: passwordError });
      return;
    }
    if (password.value !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE}/api/user/reset-password`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password.value }),
      });

      if (response.ok) {
        Alert.alert("성공", "비밀번호가 재설정되었습니다.", [
          {
            text: "확인",
            onPress: () =>
              navigation.reset({
                index: 1,
                routes: [{ name: "StartScreen" }, { name: "LoginScreen" }],
              }),
          },
        ]);
      } else {
        const msg = await response.text().catch(() => "");
        Alert.alert("실패", `비밀번호 재설정 실패 (HTTP ${response.status})\n${msg}`);
      }
    } catch (err) {
      console.error("비밀번호 변경 오류", err);
      Alert.alert("서버 오류", "서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.subtitle}>새 비밀번호 설정</Text>

        <View style={styles.formCard}>
          <View style={{ gap: 12 }}>
            <TextInput
              label="새 비밀번호"
              returnKeyType="next"
              value={password.value}
              onChangeText={t => setPassword({ value: t, error: "" })}
              secureTextEntry
              error={!!password.error}
              errorText={password.error}
              style={styles.input}
            />

            <TextInput
              label="비밀번호 확인"
              returnKeyType="done"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={[styles.input, { marginTop: 4 }]}
            />
          </View>

          <Button
            mode="contained"
            onPress={onSubmit}
            disabled={submitting}
            style={styles.btnPrimary}
            labelStyle={styles.btnPrimaryLabel}
          >
            {submitting ? "처리 중..." : "비밀번호 재설정"}
          </Button>
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
});
