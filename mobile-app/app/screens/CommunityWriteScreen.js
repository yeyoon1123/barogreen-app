// app/screens/CommunityWriteScreen.js
import React, { useState, useContext, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";

/* ===== Color System (CommunityScreen과 동일 톤) ===== */
const PRIMARY = "#2DB36F";
const DARK = "#1E8A52";
const BORDER = "#E4EFE8";
const CARD_BG = "#FAFBFA";
const TEXT_MAIN = "#1F1F1F";
const TEXT_SUB = "#6B7C70";

export default function CommunityWriteScreen() {
  const navigation = useNavigation();
  const { addPost } = usePostContext();
  const { user } = useContext(UserContext) || {};

  const username = user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (username && !author) setAuthor(username);
  }, [username, author]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("안내", "제목을 입력해주세요.");
      return;
    }
    if (!username) {
      Alert.alert("로그인 필요", "글 작성은 로그인 후 이용할 수 있습니다.");
      return;
    }
    const res = await addPost({
      title: title.trim(),
      author: username,
      content,
    });
    if (res?.ok) {
      Alert.alert("작성 완료", "글이 성공적으로 등록되었습니다.");
      navigation.goBack();
    } else {
      Alert.alert("오류", `글 등록에 실패했습니다.\n${res?.message ?? ""}`.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>글 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="제목을 입력하세요"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={TEXT_SUB}
          />
        </View>

        {/* Author (readonly) */}
        <View style={styles.fieldCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>작성자 (자동)</Text>
            <Ionicons name="lock-closed-outline" size={14} color={TEXT_SUB} />
          </View>
          <View style={[styles.input, styles.readonly]}>
            <Text style={{ color: "#4A4A4A" }}>{author || "-"}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.fieldCard}>
          <Text style={styles.label}>본문 (내용)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="본문을 입력하세요"
            value={content}
            onChangeText={setContent}
            multiline
            placeholderTextColor={TEXT_SUB}
          />
        </View>

        {/* 하단 여백 (고정 액션바와 겹치지 않도록) */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Fixed Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.ghostBtn]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.actionText, { color: "#2F3A33" }]}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleSubmit}>
          <Text style={[styles.actionText, { color: "#fff" }]}>작성 완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

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
  title: { fontSize: 18, fontWeight: "bold", color: DARK },

  body: { padding: 16 },

  fieldCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 13, color: TEXT_SUB, marginBottom: 6, fontWeight: "600" },

  input: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_MAIN,
  },
  readonly: { backgroundColor: "#F3F5F4" },
  textarea: { height: 140, textAlignVertical: "top" },

  actionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "transparent",
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ghostBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
  },
  actionText: { fontSize: 16, fontWeight: "800" },
});
