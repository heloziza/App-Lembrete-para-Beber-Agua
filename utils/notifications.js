import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_PATH = "beberagua:notificationSettings";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    alert("Precisamos da permissão para enviar notificações!");
    return false;
  }
  return true;
}

export async function updateNotifications() {
  const settings = await AsyncStorage.getItem(SETTINGS_PATH);

  const defaltSettings = {
    enabled: true,
    interval: 1 * 60 * 60,
  };

  const { enabled, interval } = settings
    ? JSON.parse(settings)
    : defaltSettings;

  console.log("Intervalo  em Horas e Segundos:", interval, interval * 60 * 60);

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (enabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora de beber água! 💧",
        body: "Mantenha-se hidratado! Que tal um copo de água agora?",
      },
      trigger: {
        seconds: interval * 60 * 60,
        repeats: true,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      },
    });
  }
}