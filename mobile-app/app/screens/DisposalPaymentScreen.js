// app/screens/DisposalPaymentScreen.js
import React, { useMemo, useState } from "react";
import { View } from "react-native";
import DisposalPayment from "../components/home/DisposalPayment";
import { DEFAULT_CATEGORIES } from "../components/home/DisposalModal";

export default function DisposalPaymentScreen({ navigation, route }) {
  const categories = useMemo(() => DEFAULT_CATEGORIES, []);
  const [category, setCategory] = useState(
    route?.params?.category || (categories[0] ? categories[0].name : ""),
  );
  const [submitting, setSubmitting] = useState(false);

  // 마이페이지에서 넘어올 때 주소를 넘기고 싶으면 params로 줄 수 있음
  const photoAddress = route?.params?.address || "";

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePay = () => {
    // DisposalPayment 안에서 KakaoPay ready 호출 + 딥링크 처리 다 하고 있으니까
    // 여기서는 로딩 상태만 간단히 관리
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <DisposalPayment
        categories={categories}
        category={category}
        onChangeCategory={setCategory}
        photoAddress={photoAddress}
        submitting={submitting}
        onBack={handleBack}
        onPay={handlePay}
      />
    </View>
  );
}
