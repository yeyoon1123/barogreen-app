// app/utils/permissions.js
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Linking, Alert } from "react-native";

export async function ensureCamera() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("권한 필요", "카메라 권한을 허용해주세요.", [
      { text: "설정 열기", onPress: () => Linking.openSettings() },
      { text: "취소" },
    ]);
    return false;
  }
  return true;
}

export async function ensureLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("권한 필요", "위치 권한을 허용해주세요.", [
      { text: "설정 열기", onPress: () => Linking.openSettings() },
      { text: "취소" },
    ]);
    return false;
  }
  return true;
}
