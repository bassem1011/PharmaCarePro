import * as Haptics from "expo-haptics";

export const tap = async () => Haptics.selectionAsync();
export const success = async () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
export const warning = async () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
export const error = async () =>
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

