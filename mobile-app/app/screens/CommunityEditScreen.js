// app/screens/CommunityEditScreen.js
import React, { useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";
import { API_BASE } from "../core/config";

/* ===== Color Tokens (CommunityScreen과 동일 톤) ===== */
const GREEN = "#2DB36F";
const GREEN_DARK = "#1E8A52";
const BORDER = "#E6EEE8";
const PAGE_BG = "#F6FAF7";
const CARD_BG = "#FFFFFF";

export default function CommunityEditScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId;

  const { posts, setPosts } = usePostContext();
  const target = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

  const { user } = useContext(UserContext) || {};
  const username =
    user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : null);

  const [title, setTitle] = useState(target?.title ?? "");
  const [content, setContent] = useState(target?.content ?? "");
  const [saving, setSaving] = useState(false);

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
      </TouchableOpacity>
      <Text style={styles.title}>글 수정</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (!target) {
    return (
      <SafeAreaView style={styles.container}>
        {Header}
        <View style={{ padding: 20 }}>
          <Text style={{ color: "#333" }}>해당 글을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ 본인 글만 수정 가능(프론트 가드)
  if (username && target.author && username !== target.author) {
    return (
      <SafeAreaView style={styles.container}>
        {Header}
        <View style={{ padding: 20 }}>
          <Text style={{ color: "#333" }}>본인이 작성한 글만 수정할 수 있습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("입력 확인", "제목을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content, author: target.author };
      const url = `${API_BASE}/api/posts/${postId}`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, title: payload.title, content: payload.content } : p,
        ),
      );

      Alert.alert("수정 완료", "글이 수정되었습니다.");
      navigation.popToTop();
    } catch (e) {
      console.error("[Edit] PUT failed:", e);
      Alert.alert("오류", "수정 중 문제가 발생했습니다.\n" + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {Header}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "android" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* 카드: 제목 */}
          <View style={styles.card}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              placeholder="제목을 입력하세요"
              placeholderTextColor="#9AA6A0"
              value={title}
              onChangeText={setTitle}
              editable={!saving}
            />
          </View>

          {/* 카드: 본문 */}
          <View style={styles.card}>
            <Text style={styles.label}>본문 (내용)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="본문을 입력하세요"
              placeholderTextColor="#9AA6A0"
              value={content}
              onChangeText={setContent}
              multiline
              editable={!saving}
            />
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryText}>수정 완료</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "bold", color: GREEN_DARK },

  content: { padding: 16, paddingBottom: 28 },

  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: GREEN_DARK,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#222",
  },
  textArea: { height: 140, textAlignVertical: "top" },

  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
