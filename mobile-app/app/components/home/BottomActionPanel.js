// app/components/home/BottomActionPanel.js

// BottomActionPanel.js — 하단 고정 패널(커뮤니티 이동, 관련 법규 & 안내, 로그아웃) 컴포넌트
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

export default function BottomActionPanel({
  GREEN_DARK,
  GREEN_BORDER,
  INK,
  onOpenCommunity,
  onOpenLawGuide,
  onLogout,
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 24,
        backgroundColor: "rgba(255,255,255,0.98)",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: GREEN_BORDER,
        ...Platform.select({ android: { elevation: 3 } }),
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <Pressable
        style={{
          height: 54,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
          backgroundColor: GREEN_DARK,
        }}
        onPress={onOpenCommunity}
      >
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
          커뮤니티
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", marginTop: 2, gap: 8 }}>
        <Pressable
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            borderWidth: 1.5,
            borderColor: GREEN_BORDER,
          }}
          onPress={onOpenLawGuide}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: INK }}>
            관련 법규 & 안내
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            height: 52,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: GREEN_DARK,
          }}
          onPress={onLogout}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
            로그아웃
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
