// src/services/notifications.ts
import type { Notification } from '@/lib/types';

/**
 * Fetches all notifications for a user.
 * In a real application, this would fetch from a database or API.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of Notification objects.
 */
export async function getNotifications(userId?: string): Promise<Notification[]> {
  // For now, we'll return an empty array to reflect the "zero notices" state.
  // In the future, this could be replaced with a real data source.
  const notifications: Notification[] = [];
  
  // Example of what a real notification might look like:
  /*
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'New Pipeline Added',
      description: 'The "CardiaHeal" pipeline has been added to the database.',
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Phase 2 Started',
      description: 'Gliobax has officially entered Phase 2 trials.',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      read: true,
    }
  ];
  */

  return Promise.resolve(notifications);
}
