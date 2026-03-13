import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const ms = target.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function syncRenewalReminders(subscriptions = []) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return { scheduled: 0, skipped: subscriptions.length };

  // Rebuild reminders on each sync to avoid duplicate local notifications.
  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  for (const sub of subscriptions) {
    if (!sub?.next_billing_date || !sub?.is_active) continue;

    const days = daysUntil(sub.next_billing_date);
    if (days < 0) continue;

    // Notify 3 days before renewal, or immediately for near renewals.
    const triggerSeconds = days > 3 ? (days - 3) * 24 * 60 * 60 : 5;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${sub.name} renews soon`,
        body: `${sub.name} renews in ${Math.max(days, 0)} day(s). Review or cancel if needed.`,
        data: { subId: sub.id },
      },
      trigger: { seconds: triggerSeconds },
    });
    scheduled += 1;
  }

  return { scheduled, skipped: Math.max(subscriptions.length - scheduled, 0) };
}
