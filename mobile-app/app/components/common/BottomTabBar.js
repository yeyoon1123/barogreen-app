// app/components/common/BottomTabBar.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { HomeIcon, CommunityIcon, ProfileIcon, LawIcon } from "./BaroIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BottomTabBar({
  active = "home",
  onPressHome,
  onPressCommunity,
  onPressLaw,
  onPressMyPage,
}) {
  const insets = useSafeAreaInsets();

  const Item = ({ label, active, onPress, Icon }) => (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.8}>
      <Icon size={24} active={active} color={active ? "#2DB36F" : "#9AA0A6"} />
      <Text
        style={[styles.label, active && styles.labelActive]}
        allowFontScaling={false}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // ✅ ANDROID에서 탭바를 더 위로 올림 (제스처 바/내비 버튼 높이 보정)
  const androidLift = Platform.select({
    android: {
      bottom: 28 + Math.round(insets.bottom * 0.6), // 필요하면 24~36 사이로 미세 조정
    },
    default: {},
  });

  return (
    <View style={[styles.wrap, androidLift, { paddingBottom: Math.max(8, insets.bottom * 0.6) }]}>
      <Item label="홈" active={active === "home"} onPress={onPressHome} Icon={HomeIcon} />
      <Item
        label="커뮤니티"
        active={active === "community"}
        onPress={onPressCommunity}
        Icon={CommunityIcon}
      />
      <Item label="법규안내" active={active === "law"} onPress={onPressLaw} Icon={LawIcon} />
      <Item
        label="마이페이지"
        active={active === "mypage"}
        onPress={onPressMyPage}
        Icon={ProfileIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12 + (Platform.OS === "ios" ? 8 : 0), // 기본 위치
    height: 64,
    backgroundColor: "#16181B",
    borderRadius: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...Platform.select({
      android: { paddingTop: 1 }, // 미세 보정 유지
    }),
  },
  label: {
    fontSize: 11,
    color: "#9AA0A6",
    fontWeight: "600",
    ...Platform.select({
      android: {
        includeFontPadding: false,
        lineHeight: 13,
        textAlignVertical: "center",
      },
    }),
  },
  labelActive: {
    color: "#2DB36F",
    fontWeight: "700",
  },
});
