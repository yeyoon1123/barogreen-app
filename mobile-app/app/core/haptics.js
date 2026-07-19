// app/utils/haptics.js
import * as Haptics from "expo-haptics";
export const hOk = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const hWarn = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const hErr = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
