// app/screens/CommunitySelectScreen.js
import React, { useMemo, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";
import { API_BASE } from "../core/config";

/* ===== BARO GREEN Palette ===== */
const GREEN_MAIN = "#2DB36F";
const GREEN_MID = "#6ECB91";
const GREEN_LIGHT = "#F6FBF8"; // 살짝 더 화이트 톤
const GREEN_BORDER = "#E2F0E7";
const GREEN_DARK = "#1E8A52";

export default function CommunitySelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || "edit";
  const routeAuthor = route.params?.author || null;

  const { user } = useContext(UserContext) || {};
  const loginName =
    user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : null);

  // 최종 기준 작성자(라우트에서 받은 author 우선)
  const author = routeAuthor || loginName;

  const { posts, setPosts } = usePostContext();
  const [loadingId, setLoadingId] = useState(null);

  // ✅ 내 글만 보이도록 필터링
  const visiblePosts = useMemo(() => {
    if (!author) return [];
    return posts.filter(p => p.author === author);
  }, [posts, author]);

  const goBackWithToast = msg => {
    Alert.alert("안내", msg, [{ text: "확인", onPress: () => navigation.goBack() }]);
  };

  async function deleteOnServer(id) {
    const url = `${API_BASE}/api/posts/${id}?author=${encodeURIComponent(author || "")}`;
    const res = await fetch(url, { method: "DELETE" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const msg = text || `삭제 실패(HTTP ${res.status})`;
      throw new Error(msg);
    }
    return text;
  }

  const handleSelect = async post => {
    if (post.author !== author) {
      Alert.alert("권한 없음", "본인이 작성한 글만 선택할 수 있습니다.");
      return;
    }

    if (mode === "edit") {
      navigation.navigate("CommunityEditScreen", { postId: post.id });
      return;
    }

    // mode === 'delete'
    Alert.alert("삭제 확인", `"${post.title}" 글을 삭제할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingId(post.id);
            await deleteOnServer(post.id); // 서버 삭제
            setPosts(prev => prev.filter(p => p.id !== post.id)); // 로컬 반영
            goBackWithToast("삭제되었습니다.");
          } catch (e) {
            Alert.alert("삭제 실패", String(e?.message || "서버 오류"));
          } finally {
            setLoadingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>{mode === "edit" ? "수정할 글 선택" : "삭제할 글 선택"}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 목록 */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {visiblePosts.map(post => (
          <TouchableOpacity
            key={post.id}
            style={styles.card}
            onPress={() => handleSelect(post)}
            activeOpacity={0.9}
            disabled={loadingId === post.id}
          >
            {/* 좌측 포인트 라인 */}
            <View style={styles.accent} />

            {/* 본문 */}
            <View style={{ flex: 1 }}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {post.title}
                </Text>
                <View style={styles.modePill}>
                  <Text style={styles.modePillText}>{mode === "edit" ? "수정" : "삭제"}</Text>
                </View>
                {loadingId === post.id && (
                  <ActivityIndicator size="small" color={GREEN_MAIN} style={{ marginLeft: 8 }} />
                )}
              </View>

              <Text style={styles.cardSub} numberOfLines={1}>
                작성자 · <Text style={styles.cardAuthor}>{post.author}</Text>
              </Text>
            </View>

            {/* 우측 화살표 */}
            <Ionicons name="chevron-forward" size={20} color="#93A09A" />
          </TouchableOpacity>
        ))}

        {visiblePosts.length === 0 && (
          <Text style={styles.emptyText}>내가 작성한 게시글이 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_LIGHT },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
  },
  title: { fontSize: 18, fontWeight: "bold", color: GREEN_DARK },

  listContent: { padding: 16, paddingBottom: 28 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: GREEN_MAIN,
    borderRadius: 4,
    opacity: 0.9,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#1f1f1f" },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EAF7F0",
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  modePillText: { fontSize: 11, color: GREEN_DARK, fontWeight: "700" },
  cardSub: { fontSize: 12, color: "#7C8B7F" },
  cardAuthor: { color: GREEN_DARK, fontWeight: "700" },

  emptyText: {
    textAlign: "center",
    color: "#8B9A93",
    marginTop: 24,
    fontSize: 13,
  },
});
