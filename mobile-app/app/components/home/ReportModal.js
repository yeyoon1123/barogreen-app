// app/components/home/ReportModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { GREEN_DARK, GREEN_LIGHT, GREEN_BORDER, INK } from "../../constants/homeTheme";

export default function ReportModal({
  visible,
  photo,
  photoCoord,
  photoAddress,
  note,
  canSubmit,
  submitting,
  onClose,
  onPickImage,
  onChangeNote,
  onSubmit,
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 바깥 회색 영역 터치 → 닫기 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* 키보드 올라올 때 살짝 올려주기 */}
        <KeyboardAvoidingView
          style={{ width: "100%" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* ✅ DisposalModal 처럼 큰 바텀 시트 */}
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.title}>불법 투기 신고</Text>

              <TouchableOpacity style={styles.uploadBtn} onPress={onPickImage}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>현장 사진 촬영</Text>
              </TouchableOpacity>

              {photo && (
                <View style={styles.previewRow}>
                  <Image source={{ uri: photo.uri }} style={styles.previewImg} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 12, color: "#333", marginBottom: 4 }}>
                      처리 전 사진
                    </Text>
                    {photoCoord ? (
                      <Text style={{ fontSize: 12, color: "#666" }}>
                        위치:{" "}
                        {photoAddress ||
                          `${photoCoord.latitude.toFixed(5)}, ${photoCoord.longitude.toFixed(5)}`}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 12, color: "#999" }}>위치: 정보 없음</Text>
                    )}
                  </View>
                </View>
              )}

              <TextInput
                placeholder="특이사항 (선택, 예: 대형 폐기물)"
                value={note}
                onChangeText={onChangeNote}
                style={styles.input}
                placeholderTextColor="#9aa3a8"
                multiline={false}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 8,
                  marginBottom: 8,
                }}
              >
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#ddd" }]}
                  onPress={onClose}
                >
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor: canSubmit && !submitting ? GREEN_DARK : "#bbb",
                      opacity: canSubmit && !submitting ? 1 : 0.6,
                    },
                  ]}
                  onPress={onSubmit}
                  disabled={!canSubmit || submitting}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    {submitting ? "신고 접수 중..." : "신고 접수하기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  // ✅ DisposalModal 과 동일한 느낌의 시트 스타일
  sheet: {
    width: "100%",
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  title: { fontSize: 18, fontWeight: "800", color: INK, marginBottom: 8 },
  uploadBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: GREEN_DARK,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  previewRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  previewImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#eee" },
  input: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: "#111",
    marginTop: 10,
  },
  btn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
