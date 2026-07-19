// app/screens/RegisterScreen.js
import React, { useState, useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import Button from "../components/Button";
import TextInput from "../components/TextInput";
import BackButton from "../components/BackButton";
import { theme } from "../core/theme";
import { emailValidator } from "../helpers/emailValidator";
import { passwordValidator } from "../helpers/passwordValidator";
import { nameValidator } from "../helpers/nameValidator";
import { UserContext } from "../context/UserContext";
import { API_BASE } from "../core/config";

export default function RegisterScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [name, setName] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });

  const [code, setCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** 회원가입용 인증코드 전송 (신규 메일만 허용) */
  const sendVerificationCode = async () => {
    const trimmed = email.value.trim();
    const emailError = emailValidator(trimmed);
    if (emailError) {
      setEmail({ value: trimmed, error: emailError });
      return;
    }
    try {
      setSending(true);
      const url = `${API_BASE}/api/email/send-signup-code?email=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { method: "POST" });

      if (res.status === 409) {
        const body = await res.text().catch(() => "");
        Alert.alert("이미 존재", body || "이미 가입된 이메일입니다.");
        return;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        Alert.alert("오류", body || `인증코드 전송 실패 (HTTP ${res.status})`);
        return;
      }

      Alert.alert("전송 성공", "인증코드를 이메일로 보냈습니다.");
      setShowCodeInput(true);
      setCodeVerified(false);
    } catch (e) {
      console.log("send-signup-code error:", e);
      Alert.alert("네트워크 오류", "서버에 연결할 수 없습니다.");
    } finally {
      setSending(false);
    }
  };

  /** 회원가입용 인증코드 검증 */
  const verifyCode = async () => {
    const trimmedEmail = email.value.trim();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      Alert.alert("오류", "인증코드를 입력하세요.");
      return;
    }
    try {
      const url = `${API_BASE}/api/email/verify-code?email=${encodeURIComponent(
        trimmedEmail,
      )}&code=${encodeURIComponent(trimmedCode)}&purpose=signup`;
      const res = await fetch(url, { method: "POST" });

      let ok;
      try {
        ok = await res.json();
      } catch {
        const txt = await res.text().catch(() => "");
        ok = txt === "true";
      }

      if (res.ok && ok === true) {
        Alert.alert("성공", "이메일 인증이 완료되었습니다.");
        setCodeVerified(true);
      } else {
        Alert.alert("실패", "인증코드가 일치하지 않습니다.");
        setCodeVerified(false);
      }
    } catch (e) {
      console.log("verify-code error:", e);
      Alert.alert("오류", "서버와 통신 중 오류가 발생했습니다.");
    }
  };

  /** 회원가입 제출 */
  const onSignUpPressed = async () => {
    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (nameError || emailError || passwordError) {
      setName({ value: name.value, error: nameError });
      setEmail({ value: email.value, error: emailError });
      setPassword({ value: password.value, error: passwordError });
      return;
    }

    if (!codeVerified) {
      Alert.alert("알림", "이메일 인증을 먼저 완료해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        Alert.alert("실패", `회원가입 실패 (HTTP ${res.status})\n${txt}`);
        return;
      }

      setUser({ name: name.value.trim(), email: email.value.trim() });
      Alert.alert("회원가입 완료", "로그인 후 이용해 주세요.");
      navigation.reset({ index: 0, routes: [{ name: "LoginScreen" }] });
    } catch (e) {
      console.log("register error:", e);
      Alert.alert("오류", "서버에 연결할 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 뒤로가기: 스택이 없을 때도 안전
  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace("StartScreen");
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
        <Text style={styles.subtitle}>회원가입</Text>

        <View style={styles.formCard}>
          <View style={{ gap: 12 }}>
            <TextInput
              label="이름"
              value={name.value}
              onChangeText={t => setName({ value: t, error: "" })}
              error={!!name.error}
              errorText={name.error}
              style={styles.input}
            />

            <TextInput
              label="이메일"
              value={email.value}
              onChangeText={t => {
                setEmail({ value: t, error: "" });
                setCodeVerified(false);
              }}
              error={!!email.error}
              errorText={email.error}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            {/* 인증코드 전송 버튼 (Outlined) */}
            <Button
              mode="outlined"
              onPress={sendVerificationCode}
              disabled={sending}
              style={styles.btnOutlined}
              labelStyle={styles.btnOutlinedLabel}
            >
              {sending ? "전송 중..." : "인증코드 보내기"}
            </Button>

            {showCodeInput && (
              <>
                <TextInput
                  label="인증 코드"
                  value={code}
                  onChangeText={setCode}
                  style={[styles.input, { marginTop: 4 }]}
                />
                <Button
                  mode="outlined"
                  onPress={verifyCode}
                  style={styles.btnOutlined}
                  labelStyle={styles.btnOutlinedLabel}
                >
                  인증 코드 확인
                </Button>
              </>
            )}

            <TextInput
              label="비밀번호"
              value={password.value}
              onChangeText={t => setPassword({ value: t, error: "" })}
              error={!!password.error}
              errorText={password.error}
              secureTextEntry
              style={[styles.input, { marginTop: 4 }]}
            />
          </View>

          <Button
            mode="contained"
            onPress={onSignUpPressed}
            disabled={submitting}
            style={styles.btnPrimary}
            labelStyle={styles.btnPrimaryLabel}
          >
            {submitting ? "처리 중..." : "다음"}
          </Button>

          <View style={styles.row}>
            <Text style={{ color: "#4B5563" }}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={() => navigation.replace("LoginScreen")}>
              <Text style={styles.link}> 로그인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ===== 디자인 토큰 (StartScreen/로그인과 일치) ===== */
const GREEN = "#34D399"; // emerald-400
const GREEN_DARK = "#10B981"; // emerald-500
const GREEN_FADE = "#E9F9F0"; // 연녹 장식
const BG = "#F7FAF5"; // 거의 화이트
const INK = "#5B7285";
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

  // 화이트 카드
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

  // Outlined 버튼 (인증코드 관련 공통)
  btnOutlined: {
    borderWidth: 2,
    borderColor: GREEN,
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 25,
  },
  btnOutlinedLabel: {
    color: GREEN_DARK,
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // 주 버튼
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

  row: { flexDirection: "row", marginTop: 10, justifyContent: "center" },
  link: { fontWeight: "bold", color: GREEN_DARK },
});
