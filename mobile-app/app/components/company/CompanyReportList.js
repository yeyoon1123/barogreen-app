  // app/components/company/CompanyReportList.js
  import React from "react";
  import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";

  const GREEN = "#2DB36F";

  export default function CompanyReportList({
    sortedFlags,
    onPressItem,
    STATUS_TEXT,
    COLOR,
    FALLBACK_IMG,
    GREEN_DARK,
    GREEN_BORDER,
    onDelete,
    onCorrection,
  }) {
    const s = styles(GREEN_BORDER, GREEN_DARK);

    return (
      
      <View style={s.listPanel}>
        <Text style={s.listTitle}>신고 목록(최신 순)</Text>

        <ScrollView style={{ flex: 1 }}>
          
          {sortedFlags.map(r => {
             console.log("[COMPANY PHOTO]", r.reportId, r.photoUri, r.completedPhoto);
            // ✅ 종류 값 정리 (guest면 종류로 안 씀)
            const rawKind = r.trashTypeLabel || r.trashType || r.category || "";
            const kind = rawKind && String(rawKind).toLowerCase() !== "guest" ? String(rawKind) : "";

            // ✅ 신고자 값 정리 (없거나 guest면 비회원)
            const rawReporter = (r.reporterId || "").toString().trim();
            const reporterLabel =
              !rawReporter || rawReporter.toLowerCase() === "guest" ? "비회원" : rawReporter;

            return (
              <TouchableOpacity key={r.reportId} style={s.item} onPress={() => onPressItem(r)}>
                <Image
                  source={{ uri: r.completedPhoto || r.photoUri || FALLBACK_IMG }}
                  style={s.itemImg}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  {/* 주소 + 정정요청 버튼 한 줄 */}
                  <View style={s.addrRow}>
                    <Text style={s.itemTitle} numberOfLines={1}>
                      {(r.address || "위치").toString()}
                    </Text>
                    <TouchableOpacity
                      style={s.correctionBtn}
                      onPress={() => onCorrection && onCorrection(r)}
                    >
                      <Text style={s.correctionText}>정정요청</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[s.badgeSmall, { borderColor: COLOR[r.status] }]}>
                    {STATUS_TEXT[r.status] || "-"}
                  </Text>

                  <Text style={s.itemNote}>
                    특이사항: {r.note ? r.note : "없음"}
                    {kind ? ` · 종류: ${String(kind)}` : ""}
                  </Text>

                  {/* ✅ 신고자 캡션: guest 포함 모두 비회원 처리 */}
                  <Text style={s.reporterCaption}>신고자: {reporterLabel}</Text>

                  {/* ✅ 상태가 'pending' 이거나 완료 사진 있는 경우 삭제 버튼 노출 */}
                  {(r.status === "pending" || !!r.completedPhoto) && (
                    <TouchableOpacity onPress={() => onDelete && onDelete(r)}>
                      <Text style={s.completedText}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  const styles = (GREEN_BORDER = "#B7E1C0", GREEN_DARK = "#1E8A52") =>
    StyleSheet.create({
      listPanel: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderRadius: 12,
        padding: 10,
        elevation: 6,
      },

      listTitle: { fontWeight: "800", color: GREEN_DARK, marginBottom: 6 },

      item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: GREEN_BORDER,
      },

      itemImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: "#ddd" },

      // ✅ 주소 + 정정요청 라인
      addrRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
      },

      itemTitle: {
        flex: 1,
        fontWeight: "700",
        color: "#1f1f1f",
        marginRight: 8,
        fontSize: 13,
      },

      correctionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: GREEN,
        alignItems: "center",
        justifyContent: "center",
      },

      correctionText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
      },

      badgeSmall: {
        marginTop: 2,
        borderWidth: 1.2,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontSize: 12,
        color: "#333",
        alignSelf: "flex-start",
      },

      itemNote: { marginTop: 2, fontSize: 12, color: "#55616a" },

      completedText: {
        marginTop: 2,
        fontSize: 11,
        color: "#E53935",
        fontWeight: "700",
      },

      reporterCaption: {
        marginTop: 2,
        fontSize: 11,
        color: "#111111", // 선명한 검정
      },
    });
