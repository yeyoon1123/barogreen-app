// app/core/offlineQueue.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { http } from "./http";

const KEY = "barogreen:offline_reports";

export async function enqueueReport(payload) {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  const list = JSON.parse(raw);
  list.push(payload);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function flushReports(API_BASE) {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  const list = JSON.parse(raw);
  if (!list.length) return 0;

  const remain = [];
  for (const it of list) {
    try {
      await http(
        `${API_BASE}/api/trash/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Accept: "application/json",
          },
          body: JSON.stringify(it),
        },
        { timeout: 10000, retries: 1 },
      );
    } catch {
      remain.push(it);
    }
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(remain));
  return remain.length;
}
