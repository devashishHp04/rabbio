import * as React from 'react';
import AppLayoutClient from './app-layout-client';
import { getNotifications } from '@/services/notifications';
import { getCurrentUser } from '@/services/auth';

export async function AppLayout({
  children,
  showSidebar = true,
}: {
  children: React.ReactNode;
  showSidebar?: boolean;
}) {
  if (!showSidebar) {
    return <>{children}</>;
  }
  const notifications = await getNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const user = await getCurrentUser();

  return (
    <AppLayoutClient user={user} unreadNotifications={unreadCount}>
      {children}
    </AppLayoutClient>
  );
}
