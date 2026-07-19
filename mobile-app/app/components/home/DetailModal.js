// 상세 보기 모달
// app/components/home/DetailModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { GREEN_DARK, MINT_FADE, INK, REPORT_STATUS } from "../../constants/homeTheme";

const { width: SCREEN_W } = Dimensions.get("window");

export default function DetailModal({ visible, report, onClose, onDelete }) {
  if (report) console.log("DETAIL REPORT >>>", report);
  if (!visible || !report) return null;

  const resolvedPhoto =
    report.photoUri ||
    report.photo_url ||
    report.photo ||
    report.imageUrl ||
    report.image_url ||
    report.image ||
    "";

  const resolvedCompletedPhoto =
    report.completedPhoto ||
    report.completed_photo ||
    report.afterImage ||
    report.after_image ||
    report.completedImage ||
    report.completedImageUrl ||
    report.completed_image_url ||
    "";
  const statusLabel =
    REPORT_STATUS?.[(report?.status || "").toUpperCase()] ||
    report?.statusLabel ||
    report?.status ||
    "상태";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>신고 상세</Text>

          <ScrollView style={{ maxHeight: SCREEN_W > 420 ? 480 : 420 }}>
            {!!report?.photoUri && (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.caption}>
                  {report?.status === "completed" && !report?.completedPhoto
                    ? "처리 완료 된 사진"
                    : "접수 완료 된 사진"}
                </Text>
                <Image source={{ uri: report.photoUri }} style={styles.image} />
              </View>
            )}
            {!!report?.completedPhoto && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.caption, { color: GREEN_DARK, fontWeight: "800" }]}>
                  처리 완료 된 사진
                </Text>
                <Image source={{ uri: report.completedPhoto }} style={styles.image} />
              </View>
            )}
          </ScrollView>

          {/*<ScrollView style={{ maxHeight: SCREEN_W > 420 ? 480 : 420 }}>
  {!!report?.photoUri && (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.caption}>접수 완료 된 사진</Text>
      <Image source={{ uri: report.photoUri }} style={styles.image} />
    </View>
  )}
  {!!report?.completedPhoto && (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.caption, { color: GREEN_DARK, fontWeight: "800" }]}>
        처리 완료 된 사진
      </Text>
      <Image source={{ uri: report.completedPhoto }} style={styles.image} />
    </View>
  )}
</ScrollView> */}
          <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            <Text style={styles.label}>주소</Text>
            <Text style={styles.value}>{report?.address || "정보 없음"}</Text>

            <Text style={[styles.label, { marginTop: 10 }]}>상태</Text>
            <View style={styles.pill}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{statusLabel}</Text>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>특이사항</Text>
            <Text style={styles.value}>
              {(report?.note && String(report.note).trim()) || "없음"}
              {report?.trashType || report?.trashTypeLabel
                ? ` · 종류: ${report.trashTypeLabel || report.trashType}`
                : ""}
              {report.type === "disposal" && <Text>종류: {report.category || "미지정"}</Text>}
            </Text>

            <Text style={[styles.label, { marginTop: 10 }]}>신고일시</Text>
            <Text style={styles.value}>
              {report?.reportedAt ? new Date(report.reportedAt).toLocaleString() : "-"}
            </Text>
          </View>
          <View style={styles.btnRow}>
            {!!onDelete && (
              <TouchableOpacity
                style={[styles.btn, styles.deleteBtn]}
                onPress={() => onDelete(report)}
              >
                <Text style={styles.btnTextWhite}>삭제</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#E9ECEF" }]}
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
  image: { width: "100%", height: SCREEN_W > 420 ? 360 : 300, backgroundColor: "#eee" },
  caption: { paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: "#6b7c70" },
  label: { fontSize: 13, color: "#8A8F98" },
  value: { fontSize: 16, color: "#222", marginTop: 2 },
  pill: {
    alignSelf: "flex-start",
    backgroundColor: MINT_FADE,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.28)",
  },
  pillText: { color: GREEN_DARK, fontWeight: "800" },
  btnRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, padding: 12 },
  btn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextWhite: { color: "#fff", fontWeight: "bold" },

  deleteBtn: {
    backgroundColor: "#EF4444", // 빨간색 삭제 버튼
  },
});
