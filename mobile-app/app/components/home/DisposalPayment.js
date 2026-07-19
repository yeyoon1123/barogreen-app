// app/components/home/DisposalPayment.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Modal,
  Image,
} from "react-native";
import WebView from "react-native-webview";
import DaumPostcodeModal from "../common/DaumPostcodeModal";
import { GREEN_DARK, GREEN_LIGHT, GREEN_BORDER, INK } from "../../constants/homeTheme";
import { PAY_BASE } from "../../core/config";
import { getBus } from "../../utils/bus";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DisposalPayment({
  categories,
  category,
  onChangeCategory,
  photoAddress,
  submitting,
  onBack,
  onPay,
}) {
  const [openCat, setOpenCat] = React.useState(false);

  // 결제/주소 폼 상태
  const [addrName, setAddrName] = React.useState("");
  const [addrPhone, setAddrPhone] = React.useState("");
  const [addrBase, setAddrBase] = React.useState(photoAddress || "");
  const [addrDetail, setAddrDetail] = React.useState("");
  const [reqCommon, setReqCommon] = React.useState("문 앞");
  const [addrZip, setAddrZip] = React.useState("");
  const [selectedPay, setSelectedPay] = React.useState(false);
  const [addrModalOpen, setAddrModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (photoAddress) setAddrBase(photoAddress);
  }, [photoAddress]);

  const selectedCategory = React.useMemo(
    () => categories.find(c => c.name === category) || null,
    [category, categories],
  );

  // 결제 WebView URL 상태 (지금은 사용 안 함)
  const [payUrl, setPayUrl] = React.useState(null);

  const [reqCustom, setReqCustom] = React.useState(""); // 기타 입력

  // 수거 시간 (오전/오후 탭 + 시간 슬롯)
  const TIME_SLOTS = React.useMemo(
    () => ({
      오전: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
      오후: ["13:00", "13:30", "14:00", "14:30", "15:00", "16:00", "17:00"],
    }),
    [],
  );
  const [pickupPeriod, setPickupPeriod] = React.useState("오전");
  const [pickupTime, setPickupTime] = React.useState(TIME_SLOTS["오전"][0]);

  // 쿠폰 상태 (1장만, 방문 수거 50% 할인)
  const [couponModalOpen, setCouponModalOpen] = React.useState(false);
  const [couponSelected, setCouponSelected] = React.useState(false);
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [hasRewardCoupon, setHasRewardCoupon] = React.useState(false); // 발급 여부

  // 앱 시작 시 / 화면 진입 시 쿠폰 보유 여부 로딩
  React.useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem("BG_REWARD_COUPON");
        setHasRewardCoupon(v === "available");
      } catch {
        // ignore
      }
    })();
  }, []);

  // 가격 규칙: 쿠폰 전 = 정가, 쿠폰 적용 시에만 50% 할인
  const RAW_BASE = selectedCategory ? selectedCategory.price : 0; // 정가
  const FINAL_PRICE = RAW_BASE; // 쿠폰 미적용 시 = 정가
  const COUPON_RATE = 0.5;
  const COUPON_DISCOUNT =
    couponApplied && hasRewardCoupon && FINAL_PRICE > 0 ? Math.floor(FINAL_PRICE * COUPON_RATE) : 0;
  const PAY_PRICE = FINAL_PRICE - COUPON_DISCOUNT; // 실제 결제 금액

  React.useEffect(() => {
    // 오전/오후 탭이 바뀌면 첫 슬롯로 기본값 설정
    setPickupTime(TIME_SLOTS[pickupPeriod][0]);
  }, [pickupPeriod, TIME_SLOTS]);

  // 결제 버튼
  const handlePay = async () => {
    if (!selectedPay) {
      Alert.alert("안내", "결제 수단을 선택해 주세요.");
      return;
    }
    if (!addrBase) {
      Alert.alert("안내", "기본 주소를 입력해 주세요.");
      return;
    }
    if (!addrName.trim()) {
      Alert.alert("안내", "수거자 이름을 입력해 주세요.");
      return;
    }
    if (!addrPhone.trim()) {
      Alert.alert("안내", "휴대폰 번호를 입력해 주세요.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("안내", "결제할 종류를 선택해 주세요.");
      return;
    }
    if (!pickupTime) {
      Alert.alert("안내", "수거 시간을 선택해 주세요.");
      return;
    }

    try {
      onPay && onPay();

      const res = await fetch(`${PAY_BASE}/api/pay/kakao/ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          orderId: `TRASH-${Date.now()}`,
          itemName: selectedCategory.name,
          quantity: 1,
          amount: PAY_PRICE,
          metadata: {
            address: addrBase,
            addressDetail: addrDetail,
            phone: addrPhone,
            request: reqCommon,
            requestDetail: reqCommon === "기타" ? reqCustom : "",
            category: selectedCategory.name,
            pickupPeriod,
            pickupTime,
            zip: addrZip,
            name: addrName,
            couponApplied,
            couponDiscount: COUPON_DISCOUNT,
          },
        }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const url = json?.redirectUrl;
      if (!url) throw new Error("redirectUrl 없음");

      // 쿠폰 사용한 결제면 1회 소진 처리
      if (couponApplied && hasRewardCoupon) {
        try {
          await AsyncStorage.setItem("BG_REWARD_COUPON", "used");
          setHasRewardCoupon(false);
        } catch {
          // ignore
        }
      }

      await Linking.openURL(url);
      // setPayUrl(url); // WebView로 띄우고 싶으면 이거 사용
    } catch (e) {
      Alert.alert("오류", `결제 준비에 실패했습니다.\n${String(e?.message || e)}`);
    }
  };

  // WebView → RN 메시지 수신
  const handleWvMessage = e => {
    try {
      const data = JSON.parse(e?.nativeEvent?.data || "{}");
      if (data.type === "kakao-result") {
        setPayUrl(null);
        Alert.alert(
          "결제",
          data.status === "success" ? "결제가 완료되었습니다." : "결제가 취소/실패했습니다.",
        );
      }
    } catch {
      // ignore
    }
  };

  // 딥링크(barogreen://) 탐지
  const handleNavReq = req => {
    const u = req?.url || "";
    if (u.startsWith("barogreen://")) {
      setPayUrl(null);
      Linking.openURL(u).catch(() => {});
      return false;
    }
    return true;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 헤더 */}
      <View style={styles.payHeader}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <Text style={{ fontSize: 18 }}>◀︎</Text>
        </TouchableOpacity>
        <Text style={styles.payHeaderTitle}>쓰레기 수거 / 결제</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* 수거지 정보 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>수거지 | {addrName || "이름"}</Text>
          <View style={{ height: 8 }} />
          <TextInput
            style={styles.lineInput}
            placeholder="이름"
            value={addrName}
            onChangeText={setAddrName}
            placeholderTextColor="#9aa3a8"
          />
          <TextInput
            style={styles.lineInput}
            placeholder="휴대폰 (예: 010 0000 0000)"
            value={addrPhone}
            onChangeText={setAddrPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#9aa3a8"
          />

          <TextInput
            style={styles.lineInput}
            placeholder="기본 주소"
            value={addrBase}
            onChangeText={text => {
              setAddrBase(text);
            }}
            placeholderTextColor="#9aa3a8"
          />

          <TouchableOpacity
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 8,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: GREEN_BORDER,
            }}
            onPress={() => setAddrModalOpen(true)}
          >
            <Text style={{ fontWeight: "700" }}>주소검색</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.lineInput}
            placeholder="상세 주소"
            value={addrDetail}
            onChangeText={setAddrDetail}
            placeholderTextColor="#9aa3a8"
          />

          <TextInput
            style={styles.lineInput}
            placeholder="우편번호"
            value={addrZip}
            onChangeText={setAddrZip}
            editable={false}
            placeholderTextColor="#9aa3a8"
          />
        </View>

        {/* 요청사항 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>수거 방법</Text>
          <View style={{ height: 10 }} />
          <SelectRow
            options={["문 앞", "집안 직접 수거", "기타"]}
            value={reqCommon}
            onChange={setReqCommon}
          />
          {reqCommon === "기타" && (
            <TextInput
              style={[styles.lineInput, { marginTop: 8 }]}
              value={reqCustom}
              onChangeText={t => {
                setReqCustom(t);
                try {
                  const hasTag = (t || "").includes("고물");
                  getBus().emit("TAG_OVERRIDE", { tag: hasTag ? "고물" : "" });
                } catch {}
              }}
              placeholder='요청사항을 입력하세요 (예: "고물 수거 부탁")'
              placeholderTextColor="#9aa3a8"
            />
          )}
        </View>

        {/* 수거 시간 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>수거 시간</Text>
          <View style={{ height: 10 }} />
          <SelectRow
            options={Object.keys(TIME_SLOTS)}
            value={pickupPeriod}
            onChange={setPickupPeriod}
          />
          <View style={{ height: 8 }} />
          <TimeGrid
            options={TIME_SLOTS[pickupPeriod]}
            value={pickupTime}
            onChange={setPickupTime}
          />
        </View>

        {/* 결제 금액 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>결제 금액</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setOpenCat(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={{ color: selectedCategory ? "#111" : "#9aa3a8" }}>
              {selectedCategory
                ? `${selectedCategory.name} (${RAW_BASE.toLocaleString()}원)`
                : "결제할 종류를 선택하세요"}
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

        {/* 쿠폰 사용 버튼 */}
        <View style={styles.couponBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.couponButton}
            onPress={() => {
              setCouponSelected(couponApplied);
              setCouponModalOpen(true);
            }}
            disabled={!selectedCategory || FINAL_PRICE <= 0 || !hasRewardCoupon}
          >
            <Text
              style={[
                styles.couponButtonText,
                couponApplied && styles.couponButtonTextApplied,
                (!selectedCategory || FINAL_PRICE <= 0 || !hasRewardCoupon) && { color: "#c0c5cc" },
              ]}
            >
              {!hasRewardCoupon
                ? "사용 가능한 쿠폰이 없습니다"
                : couponApplied
                  ? "불법투기 쓰레기 신고 보상 쿠폰 적용됨"
                  : "쿠폰 사용"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 결제 수단 */}
        <Pressable
          onPress={() => setSelectedPay(v => !v)}
          style={[styles.card, { borderColor: selectedPay ? GREEN_DARK : "#eef2f3" }]}
        >
          <Text style={styles.payCaption}>결제 수단</Text>
          <View style={styles.payMethodRow}>
            <Image
              source={require("../../../assets/kakao.png")}
              style={styles.kakaoLogo}
              resizeMode="contain"
            />
            <Text style={styles.payMethodText}>온 국민이 다 쓰는 카카오페이</Text>
          </View>
        </Pressable>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* 하단 결제 바 */}
      <View style={styles.payBar}>
        <View>
          <Text style={styles.smallLabel}>총 결제 금액</Text>
          {selectedCategory ? (
            couponApplied && hasRewardCoupon ? (
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                {FINAL_PRICE > 0 && (
                  <Text style={styles.strikePrice}>{FINAL_PRICE.toLocaleString()}원</Text>
                )}
                <Text style={styles.finalPrice}>
                  {"  "}
                  {PAY_PRICE.toLocaleString()}원
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={styles.finalPrice}>{FINAL_PRICE.toLocaleString()}원</Text>
              </View>
            )
          ) : (
            <Text style={{ fontSize: 14, color: "#9aa3a8", marginTop: 4 }}>
              결제할 종류를 선택해 주세요
            </Text>
          )}
          <Text style={{ marginTop: 2, fontSize: 12, color: "#67707a" }}>
            {pickupPeriod} {pickupTime} 수거 예정
          </Text>
          {couponApplied && hasRewardCoupon && (
            <Text style={{ marginTop: 2, fontSize: 11, color: "#16a34a" }}>
              불법투기 쓰레기 신고 보상 쿠폰: 방문 수거 50% 할인 적용
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={submitting}>
          <Text style={styles.payButtonText}>{submitting ? "결제 중..." : "결제하기"}</Text>
        </TouchableOpacity>
      </View>

      {/* 결제 WebView 모달 (현재는 사용 안 함) */}
      <Modal
        visible={!!payUrl}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPayUrl(null)}
      >
        <View style={{ flex: 1 }}>
          <WebView
            source={{ uri: payUrl || "about:blank" }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleWvMessage}
            onShouldStartLoadWithRequest={handleNavReq}
            injectedJavaScript={`window.alert = function() {}; true;`}
          />
        </View>
      </Modal>

      {/* 주소검색 모달 */}
      <DaumPostcodeModal
        visible={addrModalOpen}
        onClose={() => setAddrModalOpen(false)}
        onSelected={data => {
          const nextAddr = data?.address || data?.roadAddress || "";
          const nextZip = data?.zonecode || "";
          setAddrBase(nextAddr);
          setAddrZip(nextZip);
          setAddrDetail("");
          try {
            getBus().emit("ADDRESS_OVERRIDE", { address: nextAddr, zip: nextZip });
          } catch (e) {}
        }}
        title="카카오 주소검색"
      />

      {/* 쿠폰 선택 모달 */}
      <Modal
        visible={couponModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponModalOpen(false)}
      >
        <View style={styles.couponBackdrop}>
          <View style={styles.couponSheet}>
            {/* 상단 헤더 */}
            <View style={styles.couponHeader}>
              <Text style={styles.couponHeaderTitle}>쿠폰 사용</Text>
              <TouchableOpacity
                onPress={() => setCouponModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.couponHeaderClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={styles.couponItem}>
                {/* 라디오 버튼 */}
                <TouchableOpacity
                  style={styles.couponRadio}
                  onPress={() => setCouponSelected(v => !v)}
                  disabled={!hasRewardCoupon}
                >
                  <View style={styles.couponRadioOuter}>
                    {couponSelected && <View style={styles.couponRadioInner} />}
                  </View>
                </TouchableOpacity>

                {/* 내용 */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={styles.couponDiscountText}>
                      {FINAL_PRICE > 0
                        ? `${Math.floor(FINAL_PRICE * COUPON_RATE).toLocaleString()}원 할인`
                        : "0원 할인"}
                    </Text>
                    <View style={styles.couponTag}>
                      <Text style={styles.couponTagText}>방문 수거 50%</Text>
                    </View>
                  </View>
                  <Text style={styles.couponName}>불법투기 쓰레기 신고 보상 쿠폰</Text>
                  <Text style={styles.couponDesc}>방문 수거 서비스 1회 50% 할인</Text>
                  <Text style={styles.couponExpire}>2025.12.31까지</Text>
                </View>
              </View>
            </ScrollView>

            {/* 하단 적용 버튼 */}
            <View style={styles.couponApplyBar}>
              <TouchableOpacity
                style={styles.couponApplyButton}
                onPress={() => {
                  if (hasRewardCoupon) {
                    setCouponApplied(couponSelected && FINAL_PRICE > 0);
                  } else {
                    setCouponApplied(false);
                  }
                  setCouponModalOpen(false);
                }}
                disabled={FINAL_PRICE <= 0 || !hasRewardCoupon}
              >
                <Text style={styles.couponApplyText}>적용하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* 요청사항 선택 행 */
function SelectRow({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              {
                paddingHorizontal: 12,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                alignItems: "center",
                justifyContent: "center",
                borderColor: active ? GREEN_DARK : GREEN_BORDER,
                backgroundColor: active ? GREEN_LIGHT : "#fff",
              },
            ]}
          >
            <Text style={{ color: active ? INK : "#444" }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* 시간 슬롯 그리드 */
function TimeGrid({ options, value, onChange }) {
  return (
    <View style={styles.gridWrap}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.timeChip,
              {
                borderColor: active ? GREEN_DARK : GREEN_BORDER,
                backgroundColor: active ? GREEN_LIGHT : "#fff",
              },
            ]}
          >
            <Text style={{ color: active ? INK : "#333", fontWeight: active ? "700" : "500" }}>
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  payHeader: {
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e8eb",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  payHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eef2f3",
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  lineInput: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 8,
    backgroundColor: "#fff",
    color: "#111",
  },
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
  smallLabel: { fontSize: 12, color: "#67707a" },
  payBar: {
    height: 74,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e8eb",
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strikePrice: {
    fontSize: 13,
    color: "#9aa3a8",
    textDecorationLine: "line-through",
  },
  finalPrice: { fontSize: 20, fontWeight: "800", color: "#E11D48" },
  payButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: GREEN_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  payCaption: {
    fontSize: 12,
    color: "#67707a",
    marginBottom: 8,
  },
  payMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kakaoLogo: {
    width: 110,
    height: 40,
  },
  payMethodText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "700",
  },
  // 시간 그리드
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  // 쿠폰 영역/모달
  couponBar: {
    marginHorizontal: 0,
    marginBottom: 12,
  },
  couponButton: {
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#dde1e4",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  couponButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  couponButtonTextApplied: {
    color: GREEN_DARK,
  },
  couponBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  couponSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    overflow: "hidden",
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e8eb",
  },
  couponHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  couponHeaderClose: {
    fontSize: 18,
    color: "#111",
  },
  couponItem: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e8eb",
    backgroundColor: "#fbfbfd",
    marginTop: 12,
  },
  couponRadio: {
    paddingRight: 10,
    justifyContent: "center",
  },
  couponRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  couponRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN_DARK,
  },
  couponDiscountText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginRight: 6,
  },
  couponTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },
  couponTagText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
  },
  couponName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  couponDesc: {
    fontSize: 12,
    color: "#4b5563",
    marginTop: 2,
  },
  couponExpire: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
  couponApplyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e8eb",
    padding: 12,
  },
  couponApplyButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: GREEN_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  couponApplyText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
