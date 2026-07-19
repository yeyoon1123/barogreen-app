// app/components/home/DisposalModal.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { GREEN_DARK, GREEN_LIGHT, GREEN_BORDER, INK } from "../../constants/homeTheme";
import DisposalPayment from "./DisposalPayment";

// 기본 카테고리 및 금액 (필요 시 상위에서 categories로 override)
export const DEFAULT_CATEGORIES = [
  { name: "일반 쓰레기", price: 2700 }, // 8000 → 2700
  { name: "재활용", price: 2000 }, // 6000 → 2000
  { name: "대형 폐기물", price: 5000 }, // 15000 → 5000
  { name: "음식물", price: 1700 }, // 5000 → 1700 (반올림)
];

export default function DisposalModal({
  visible,
  categories = DEFAULT_CATEGORIES,
  category,
  onChangeCategory,
  photo,
  photoCoord,
  photoAddress,
  note,
  canSubmit,
  submitting,
  onClose,
  onPickImage,
  onChangeNote,
  onSubmit, // 최종 결제/등록 실행
}) {
  // 단계: form → pay
  const [step, setStep] = useState("form");
  const [openCat, setOpenCat] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find(c => c.name === category) || null,
    [category, categories],
  );

  const canGoPay = useMemo(() => {
    return canSubmit && !!category && !!photo;
  }, [canSubmit, category, photo]);

  const resetAllAndClose = () => {
    setStep("form");
    setOpenCat(false);
    onClose && onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAllAndClose}>
      <View style={styles.backdrop}>
        {/* 배경 아무 곳이나 탭 → 닫기 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={resetAllAndClose} />
        <View style={styles.sheet}>
          {step === "form" ? (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.title}>쓰레기 방문 수거</Text>

              {/* 카테고리 */}
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>쓰레기 종류</Text>
                <TouchableOpacity
                  style={styles.selectBox}
                  onPress={() => setOpenCat(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: category ? "#111" : "#9aa3a8" }}>
                    {category || "종류를 선택하세요"}
                  </Text>
                  <Text style={{ color: "#666" }}>▾</Text>
                </TouchableOpacity>

                {openCat && (
                  <View style={styles.dropdown}>
                    {categories.map(c => (
                      <TouchableOpacity
                        key={c.name}
                        style={styles.option}
                        onPress={() => {
                          onChangeCategory(c.name);
                          setOpenCat(false);
                        }}
                      >
                        <Text style={{ color: "#111" }}>
                          {c.name} ({c.price.toLocaleString()}원)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 사진 업로드 */}
              <TouchableOpacity style={styles.uploadBtn} onPress={onPickImage}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>사진 촬영/업로드</Text>
              </TouchableOpacity>

              {/* 프리뷰 */}
              {photo && (
                <View style={styles.previewRow}>
                  <Image source={{ uri: photo.uri }} style={styles.previewImg} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontSize: 12, color: "#333", marginBottom: 4 }}>
                      사진 미리보기
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

              {/* 메모 */}
              <TextInput
                placeholder="설명 (선택)"
                value={note}
                onChangeText={onChangeNote}
                style={styles.input}
                placeholderTextColor="#9aa3a8"
              />

              {/* 하단 버튼 */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#ddd" }]}
                  onPress={resetAllAndClose}
                >
                  <Text>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    {
                      backgroundColor: canGoPay && !submitting ? GREEN_DARK : "#bbb",
                      opacity: canGoPay && !submitting ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => setStep("pay")}
                  disabled={!canGoPay || submitting}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>결제하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <DisposalPayment
              categories={categories}
              category={category}
              onChangeCategory={onChangeCategory}
              photoAddress={photoAddress}
              submitting={submitting}
              onBack={() => setStep("form")}
              onPay={onSubmit}
            />
          )}
        </View>
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
  sheet: {
    width: "100%",
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  title: { fontSize: 18, fontWeight: "800", color: INK, marginBottom: 8 },
  label: { fontSize: 12, color: "#67707a", marginBottom: 6 },
  selectBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_LIGHT,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: GREEN_BORDER,
  },
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
