import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Project, NotificationSettings } from '../types';

// expo-notifications is not supported on web
const isSupported = Platform.OS !== 'web';

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelProjectReminders(projectId: string): Promise<void> {
  if (!isSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.content.data?.projectId === projectId);
    await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  } catch {}
}

export async function scheduleDeadlineReminders(
  project: Project,
  settings: NotificationSettings
): Promise<void> {
  if (!isSupported) return;
  try {
    await cancelProjectReminders(project.id);
    if (!settings.enabled) return;

    const reminderDays = [
      settings.remind7Days ? 7 : null,
      settings.remind3Days ? 3 : null,
      settings.remind1Day ? 1 : null,
    ].filter((d): d is number => d !== null);

    const now = Date.now();

    for (const days of reminderDays) {
      const fireTime = project.deadline - days * 24 * 60 * 60 * 1000;
      if (fireTime <= now) continue;

      const label = days === 1 ? '1 day' : `${days} days`;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Project Deadline Reminder',
          body: `"${project.title}" is due in ${label}!`,
          data: { projectId: project.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(fireTime),
        },
      });
    }
  } catch {}
}
