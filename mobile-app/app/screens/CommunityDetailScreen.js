// app/screens/CommunityDetailScreen.js
import React, { useMemo, useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";

/* ===== Color Tokens (커뮤니티 공통 톤) ===== */
const GREEN = "#2DB36F";
const GREEN_DARK = "#1E8A52";
const BORDER = "#E6EEE8";
const PAGE_BG = "#F6FAF7";
const CARD_BG = "#FFFFFF";

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = n => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function CommunityDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {};

  const { posts, addComment, syncComments } = usePostContext();

  const { user } = useContext(UserContext) || {};
  const username =
    user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : null) || "guest";

  const post = useMemo(() => posts.find(p => p.id === postId), [posts, postId]);

  const [commentText, setCommentText] = useState("");

  // 최신 댓글 동기화
  useEffect(() => {
    if (postId) syncComments(postId).catch(() => {});
  }, [postId, syncComments]);

  // ✅ 답글 기능 삭제 → 항상 parentId: null 로 저장
  const onSend = async () => {
    const text = commentText.trim();
    if (!text) return;
    try {
      await addComment(postId, {
        author: username,
        content: text,
        parentId: null,
      });
      setCommentText("");
      syncComments(postId).catch(() => {});
    } catch {}
  };

  const Header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>글 상세</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // 평면 댓글 리스트 (parentId 가 null 인 것만)
  const flatComments = useMemo(
    () => (post?.comments ?? []).filter(c => c.parentId == null),
    [post],
  );

  return (
    <SafeAreaView style={styles.container}>
      {Header}

      {!post ? (
        <View style={{ padding: 20 }}>
          <Text>글을 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "android" ? 0 : 20}
        >
          <ScrollView contentContainerStyle={styles.contentWrap}>
            <View style={styles.card}>
              {/* 제목 */}
              <Text style={styles.title}>{post.title}</Text>

              {/* 메타(작성자 · 시간) */}
              <View style={styles.metaRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={18}
                  color={GREEN_DARK}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.metaText}>작성자</Text>
                <Text style={styles.metaValue}>{post.author}</Text>
                <Text style={styles.dot}>·</Text>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="#7C8B7F"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.metaValue}>{formatDate(post.createdAt)}</Text>
              </View>

              <View style={styles.divider} />

              {/* 본문 박스 */}
              <View style={styles.bodyBox}>
                <Text style={styles.bodyLabel}>본문</Text>
                <Text style={styles.bodyText} selectable>
                  {post.content?.trim()?.length ? post.content : "내용이 없습니다."}
                </Text>
              </View>

              {/* 댓글 */}
              <View style={styles.commentsWrap}>
                <Text style={styles.commentsTitle}>댓글</Text>
                {flatComments.length === 0 && (
                  <Text style={{ color: "#6b7c70" }}>아직 댓글이 없습니다.</Text>
                )}

                {flatComments.map(c => {
                  const key = `c-${c.id}-${c.createdAt ?? ""}`;
                  return (
                    <View key={key} style={styles.commentItem}>
                      <Text style={styles.commentHeader}>
                        {c.author} <Text style={styles.commentTime}>{formatDate(c.createdAt)}</Text>
                      </Text>
                      <Text style={styles.commentBody}>{c.content}</Text>
                    </View>
                  );
                })}

                {/* 입력창 */}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="댓글을 입력하세요"
                    placeholderTextColor="#99a9a0"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
                    <Ionicons name="send" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: GREEN_DARK },

  contentWrap: { padding: 16 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  title: { fontSize: 20, fontWeight: "800", color: "#1f1f1f", marginBottom: 8 },

  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  metaText: { fontSize: 13, color: "#607566", marginRight: 6 },
  metaValue: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginRight: 6,
  },
  dot: { marginHorizontal: 6, color: "#9aa79f" },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginVertical: 12,
  },

  bodyBox: {
    backgroundColor: "#F4FBF7",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    padding: 12,
  },
  bodyLabel: {
    fontSize: 12,
    color: "#607566",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  bodyText: { fontSize: 16, lineHeight: 24, color: "#1F2937" },

  commentsWrap: { marginTop: 18 },
  commentsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: GREEN_DARK,
  },

  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },

  commentHeader: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
    fontWeight: "600",
  },
  commentTime: { fontSize: 12, color: "#7f8f84", fontWeight: "400" },
  commentBody: { fontSize: 14, color: "#111" },

  inputRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    maxHeight: 120,
    color: "#222",
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: GREEN,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});
