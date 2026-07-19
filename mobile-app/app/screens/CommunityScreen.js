// app/screens/CommunityScreen.js
import React, { useContext, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";
// ✅ 추가: 하단 탭바 import
import BottomTabBar from "../components/common/BottomTabBar";

/* ===== Palette ===== */
const GREEN = "#2DB36F";
const GREEN_DARK = "#1E8A52";
const INK = "#1F2937";
const SUBINK = "#6B7280";
const BORDER_SOFT = "#E8EDF0";
const TABBAR_HEIGHT = 70;

const FAB_SIZE = 56; // FAB 지름(대략)
const FAB_MARGIN = 22; // 오른쪽 여백
const FAB_RIGHT_GAP = FAB_SIZE + FAB_MARGIN + 10; // bottomBar가 피해야 할 오른쪽 공간

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s 전`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  const date = new Date(ts);
  const pad = n => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CommunityScreen() {
  const navigation = useNavigation();
  const { posts } = usePostContext();

  const { user } = useContext(UserContext) || {};
  const isMember = !!user && user?.guest !== true;
  const username =
    user?.displayName || user?.name || (user?.email ? user.email.split("@")[0] : "익명");

  const myPostCount = useMemo(
    () => posts.filter(p => username && p.author === username).length,
    [posts, username],
  );

  const requireLogin = actionLabel => {
    if (!isMember) {
      Alert.alert("로그인 필요", `${actionLabel} 하려면 먼저 로그인하세요.`);
      return false;
    }
    return true;
  };

  const goSelect = mode => {
    if (!requireLogin(mode === "edit" ? "수정" : "삭제")) return;
    if (myPostCount === 0) {
      Alert.alert("안내", "내가 작성한 글이 없습니다.");
      return;
    }
    navigation.navigate("CommunitySelectScreen", { mode, author: username });
  };

  const SWIPE_THRESHOLD = 40;

  const goPrev = () => {
    // 이전: 홈
    navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] });
  };

  const goNext = () => {
    // 다음: 관련 법규
    navigation.reset({ index: 0, routes: [{ name: "FirstAidGuideScreen" }] });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          goNext();
        } else if (gestureState.dx > SWIPE_THRESHOLD) {
          goPrev();
        }
      },
    }),
  ).current;

  const FOOTER_SAFE = Platform.OS === "android" ? 22 : 8;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {/* 메인 컨텐츠 */}
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 22 }} />
          <Text style={styles.title}>커뮤니티</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* List */}
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]}>
          {posts.map(post => {
            const key = `${post?.id ?? "tmp"}-${post?.createdAt ?? 0}`;
            return (
              <TouchableOpacity
                key={key}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("CommunityDetailScreen", {
                    postId: post.id,
                  })
                }
              >
                <View style={styles.leftAccent} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>{post.title}</Text>
                    <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
                  </View>
                  <Text style={styles.author}>
                    작성자:{" "}
                    <Text style={{ color: GREEN_DARK, fontWeight: "700" }}>{post.author}</Text>
                  </Text>
                  {!!post.content && (
                    <Text style={styles.preview} numberOfLines={2}>
                      {post.content}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom actions (outline 2 buttons) */}
        {isMember && (
          <View style={[styles.bottomBar, { paddingBottom: FOOTER_SAFE + TABBAR_HEIGHT }]}>
            <TouchableOpacity
              style={[styles.ghostBtn, { marginRight: 6 }]}
              onPress={() => goSelect("edit")}
              activeOpacity={0.9}
            >
              <Ionicons name="create-outline" size={18} color={INK} />
              <Text style={styles.ghostText}>내 글 수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ghostBtn, { marginLeft: 6 }]}
              onPress={() => goSelect("delete")}
              activeOpacity={0.9}
            >
              <Ionicons name="trash-outline" size={18} color={INK} />
              <Text style={styles.ghostText}>내 글 삭제</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Floating primary FAB (글 작성) */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (!isMember) {
              Alert.alert("안내", "회원가입 후 이용 가능합니다.");
              return;
            }
            navigation.navigate("CommunityWriteScreen");
          }}
          activeOpacity={0.92}
        >
          <Ionicons name="pencil" size={22} color="#fff" />
          <Text style={styles.fabText}>글 작성</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ✅ 하단 탭바: SafeAreaView와 '형제'로, 화면에 떠 있도록 절대배치 */}
      <BottomTabBar
        active="community"
        onPressHome={() => navigation.reset({ index: 0, routes: [{ name: "HomeScreen" }] })}
        onPressCommunity={() =>
          navigation.reset({ index: 0, routes: [{ name: "CommunityScreen" }] })
        }
        onPressLaw={() => navigation.reset({ index: 0, routes: [{ name: "FirstAidGuideScreen" }] })}
        onPressMyPage={() => navigation.reset({ index: 0, routes: [{ name: "MyPageScreen" }] })}
      />
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: BORDER_SOFT,
    backgroundColor: "#fff",
  },
  backHit: { padding: 6, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: "800", color: GREEN_DARK },

  content: { padding: 16, paddingTop: 12 },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    ...(Platform.OS === "android" ? { elevation: 2 } : null),
  },
  leftAccent: { width: 3.5, borderRadius: 3, backgroundColor: GREEN },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: INK, marginBottom: 2 },
  timeText: { fontSize: 12, color: SUBINK },
  author: { fontSize: 13, color: SUBINK, marginTop: 2 },
  preview: { fontSize: 14, color: INK, marginTop: 6, lineHeight: 20 },

  /* Bottom outline bar */
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 25,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    paddingHorizontal: 10,
    paddingTop: 10,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    ...(Platform.OS === "android" ? { elevation: 6 } : null),
  },
  ghostBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER_SOFT,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  ghostText: { color: INK, fontSize: 15, fontWeight: "700" },

  /* Floating primary action */
  fab: {
    position: "absolute",
    right: 22,
    bottom: 110 + TABBAR_HEIGHT, // bottomBar 및 BottomTabBar 위로 띄움
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    backgroundColor: GREEN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 25,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    ...(Platform.OS === "android" ? { elevation: 6 } : null),
  },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
