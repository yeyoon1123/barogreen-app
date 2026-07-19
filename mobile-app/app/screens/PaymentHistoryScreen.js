// app/screens/PaymentHistoryScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GREEN_DARK, GREEN_BORDER, GREEN_LIGHT, INK } from "../constants/homeTheme";
import { PAY_BASE } from "../core/config";

export default function PaymentHistoryScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`${PAY_BASE}/api/pay/kakao/history`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (Array.isArray(json)) {
          setPayments(json);
        } else {
          setPayments([]);
        }
      } catch (e) {
        console.warn("fetch payments error", e);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const renderItem = ({ item }) => {
    return (
      <View style={styles.itemCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.itemTitle}>{item.itemName}</Text>
          <Text style={styles.itemAmount}>{Number(item.amount || 0).toLocaleString()}원</Text>
        </View>
        <View style={{ height: 6 }} />
        <Text style={styles.itemSub}>결제번호 | {item.orderId}</Text>
        <Text style={styles.itemSub}>결제일시 | {item.paidAt}</Text>
        <Text
          style={[
            styles.itemStatus,
            (item.status === "결제완료" || item.status === "SUCCESS") && styles.itemStatusDone,
          ]}
        >
          {item.status === "SUCCESS" ? "결제완료" : item.status}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.wrap}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHit}>
          <Ionicons name="chevron-back" size={22} color={INK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>결제 내역</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
        {loading ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>불러오는 중...</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>결제 내역이 없습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
  },
  backHit: {
    padding: 6,
    borderRadius: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: GREEN_DARK },

  itemCard: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: INK,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  itemSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  itemStatus: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 11,
    color: "#6b7280",
    backgroundColor: GREEN_LIGHT,
  },
  itemStatusDone: {
    color: GREEN_DARK,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
  },
});
