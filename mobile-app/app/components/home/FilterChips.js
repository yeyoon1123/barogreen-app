// 상단 필터 칩
// app/components/home/FilterChips.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { GREEN_BORDER, GREEN_DARK, MINT_FADE, INK, REPORT_STATUS } from "../../constants/homeTheme";

export default function FilterChips({ value, onChange }) {
  const items = [
    { key: "ALL", label: "전체" },
    { key: "pending", label: REPORT_STATUS.PENDING },
    { key: "completed", label: REPORT_STATUS.COMPLETED },
  ];
  return (
    <View style={styles.row}>
      {items.map(b => {
        const active = value.toLowerCase() === b.key.toLowerCase();
        return (
          <TouchableOpacity
            key={b.key}
            onPress={() => onChange(b.key.toUpperCase() === "ALL" ? "ALL" : b.key)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{b.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    alignItems: "center",
  },
  btnActive: { backgroundColor: MINT_FADE, borderColor: "rgba(16,185,129,0.28)" },
  text: { color: INK, fontWeight: "700", fontSize: 12 },
  textActive: { color: GREEN_DARK, fontWeight: "800" },
});
