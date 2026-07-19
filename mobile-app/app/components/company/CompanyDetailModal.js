// app/components/company/CompanyDetailModal.js
import React from "react";
import { View, Text, Modal, TouchableOpacity, Image, ScrollView, StyleSheet } from "react-native";

export default function CompanyDetailModal({
  visible,
  current,
  onClose,
  STATUS_TEXT,
  GREEN,
  GREEN_DARK,
  SCREEN_W,
  fmtKo,
  navBusy,
  startNavigation,
  markCompleted,
  completing,
  onDelete,
}) {
  // ✅ 종류 값 정리 (guest면 종류로 안 씀)
  const rawKind = current?.trashTypeLabel || current?.trashType || current?.category || "";
  const kind = rawKind && String(rawKind).toLowerCase() !== "guest" ? String(rawKind) : "";

  // ✅ 신고자 값 정리 (없거나 guest면 비회원)
  const rawReporter = (current?.reporterId || "").toString().trim();
  const reporterLabel =
    !rawReporter || rawReporter.toLowerCase() === "guest" ? "비회원" : rawReporter;

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>신고 상세(업체)</Text>

          <ScrollView style={{ maxHeight: SCREEN_W > 420 ? 480 : 420 }}>
            {!!current?.photoUri && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    paddingHorizontal: 12,
                    paddingBottom: 6,
                    fontSize: 12,
                    color: "#6b7c70",
                  }}
                >
                  사용자가 접수 한 사진
                </Text>
                <Image source={{ uri: current.photoUri }} style={styles.mainImg(SCREEN_W)} />
              </View>
            )}
            {!!current?.completedPhoto && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    paddingHorizontal: 12,
                    paddingBottom: 6,
                    fontSize: 12,
                    color: "#1E8A52",
                    fontWeight: "800",
                  }}
                >
                  처리 완료 된 사진
                </Text>
                <Image source={{ uri: current.completedPhoto }} style={styles.mainImg(SCREEN_W)} />
              </View>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}>
            <Text style={styles.label}>주소</Text>
            <Text style={styles.value}>{current?.address || "정보 없음"}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>상태</Text>
            <View style={styles.pill}>
              <Text style={{ color: GREEN_DARK, fontWeight: "800" }}>
                {STATUS_TEXT[current?.status] || "-"}
              </Text>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>촬영일시</Text>
            <Text style={styles.value}>{fmtKo(current?.reportedAt)}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>특이사항</Text>
            <Text style={styles.value}>
              {current?.note ? current.note : "없음"}
              {kind ? ` · 종류: ${kind}` : ""}
            </Text>

            {/* ✅ guest 포함 모두 정리된 신고자 라벨 사용 */}
            <Text style={styles.reporterCaption}>신고자: {reporterLabel}</Text>
          </View>

          <View style={styles.row}>
            {/* 🔴 삭제 버튼 (목록과 동일 기능) */}
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={() => onDelete && current && onDelete(current)}
            >
              <Text style={styles.deleteBtnText}>삭제</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: GREEN, marginRight: 10 }]}
              onPress={markCompleted}
              disabled={completing || current?.status === "completed"}
            >
              <Text style={styles.btnText}>{completing ? "업로드 중..." : "수거 완료(촬영)"}</Text>
            </TouchableOpacity>

            {/* 닫기 */}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#E9ECEF", marginLeft: 6 }]}
              onPress={onClose}
            >
              <Text style={{ color: "#333", fontWeight: "bold" }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#222",
    textAlign: "center",
    paddingVertical: 12,
  },
  mainImg: SCREEN_W => ({
    width: "100%",
    height: SCREEN_W > 420 ? 360 : 300,
    backgroundColor: "#eee",
  }),
  label: { fontSize: 13, color: "#8A8F98" },
  value: { fontSize: 16, color: "#222", marginTop: 2 },
  // ✅ 신고자 캡션 스타일
  reporterCaption: {
    marginTop: 6,
    fontSize: 13, // 🔼 살짝 키움
    color: "#111111", // 🔼 회색 → 진한 검정
    fontWeight: "600",
  },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  row: { flexDirection: "row", justifyContent: "flex-end", padding: 12 },
  btn: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  // 🔴 가운데 삭제 버튼용 스타일
  deleteBtn: {
    backgroundColor: "#E53935",
    marginHorizontal: 4,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
