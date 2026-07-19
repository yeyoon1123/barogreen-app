// 마커 콜아웃 카드
// app/components/home/CalloutCard.js
import React from "react";
import { View, Image, Text, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { INK, GREEN_BORDER } from "../../constants/homeTheme";

export default function CalloutCard({ photoUrl, title, addr, hint, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <Image source={{ uri: photoUrl }} style={styles.img} />
      <View style={{ padding: 8 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.addr}>{(addr || "근처").toString().slice(0, 28)}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({ android: { elevation: 4 } }),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  img: { width: 220, height: 110, backgroundColor: "#ddd" },
  title: { fontWeight: "800", color: INK },
  addr: { fontSize: 12, color: "#6b7c70", marginTop: 2 },
  hint: { fontSize: 11, color: "#9aa1a7", marginTop: 6 },
});
