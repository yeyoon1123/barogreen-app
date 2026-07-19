import React, { useState, useContext } from "react";
import { TouchableOpacity, StyleSheet, View, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import Header from "../components/Header";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { UserContext } from "../context/UserContext";
import { API_BASE } from "../core/config";

export default function LoginScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [submitting, setSubmitting] = useState(false);

  const onLoginPressed = async () => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE}/api/user/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value }),
      });

      if (response.ok) {
        const userData = await response.json().catch(() => null);
        if (!userData) {
          Alert.alert("오류", "서버 응답이 올바르지 않습니다.");
          return;
        }
        setUser(userData);
        Alert.alert("로그인 성공", `${userData.name}님 환영합니다!`);
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeScreen", params: { username: userData.name } }],
        });
      } else {
        const errorMsg = await response.text().catch(() => "");

        console.log("hello");

        Alert.alert("로그인 실패", errorMsg || "이메일 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      console.error("로그인 오류:", err);
      Alert.alert("오류", "서버에 연결할 수 없습니다.");
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

      {/* 상단 좌측 뒤로가기 */}
      <BackButton goBack={safeGoBack} style={styles.backBtn} />

      {/* 중앙 타이틀 + 폼 카드 */}
      <View style={styles.center}>
        <Text style={styles.title}>BARO GREEN</Text>

        <View style={styles.formCard}>
          <View style={{ gap: 12 }}>
            <TextInput
              label="이메일"
              value={email.value}
              onChangeText={t => setEmail({ value: t, error: "" })}
              error={!!email.error}
              errorText={email.error}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              label="비밀번호"
              value={password.value}
              onChangeText={t => setPassword({ value: t, error: "" })}
              error={!!password.error}
              errorText={password.error}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.forgotPassword}>
            <TouchableOpacity onPress={() => navigation.navigate("ResetPasswordScreen")}>
              <Text style={styles.forgot}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={onLoginPressed}
            disabled={submitting}
            style={styles.btnPrimary}
            labelStyle={styles.btnPrimaryLabel}
          >
            {submitting ? "처리 중..." : "로그인"}
          </Button>

          <View style={styles.row}>
            <Text style={{ color: "#4B5563" }}>아직 계정이 없으신가요?</Text>
            <TouchableOpacity onPress={() => navigation.replace("RegisterScreen")}>
              <Text style={styles.link}>회원가입하기!</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("CompanyLoginScreen")}
            style={{ marginTop: 12, alignSelf: "center" }}
          >
            <Text style={styles.companyLink}>업체 로그인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ===== 디자인 토큰 (StartScreen 매칭) ===== */
const GREEN = "#34D399"; // emerald-400 (밝은 그린)
const GREEN_DARK = "#10B981"; // emerald-500
const GREEN_FADE = "#E9F9F0"; // 연녹 장식
const BG = "#F7FAF5"; // 거의 화이트
const INK = "#5B7285";
const BORDER_MUTE = "#E7EEF2";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  /* 상단 소프트 장식 — 위치/톤 StartScreen과 동일 느낌 */
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

  /* 뒤로가기 버튼 여백 */
  backBtn: {
    marginTop: 4,
    marginLeft: 8,
  },

  /* 중앙 레이아웃 */
  center: {
    flex: 1,
    justifyContent: "center", // ✅ 세로 중앙
    alignItems: "center", // ✅ 가로 중앙
    paddingHorizontal: 20,
  },

  /* StartScreen 타이틀과 동일한 위계 */
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: GREEN_DARK,
    letterSpacing: 0.4,
    textAlign: "center",
    marginBottom: 14,
  },

  /* 화이트 카드 폼 */
  formCard: {
    width: "92%",
    maxWidth: 560,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: BORDER_MUTE,
    // 은은한 그림자
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },

  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 12,
  },
  forgot: { fontSize: 13, color: "#6B7280" },

  // 로그인 버튼 (StartScreen과 동일 톤/곡률/그림자)
  btnPrimary: {
    height: 56,
    borderRadius: 28,
    backgroundColor: GREEN,
    shadowColor: GREEN_DARK,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  btnPrimaryLabel: { fontSize: 16.5, fontWeight: "800", letterSpacing: 0.2 },

  row: { flexDirection: "row", marginTop: 12, justifyContent: "center" },
  link: { fontWeight: "bold", color: GREEN_DARK, marginLeft: 6 },
  companyLink: { fontWeight: "bold", color: GREEN_DARK },
});
