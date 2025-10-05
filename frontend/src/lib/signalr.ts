import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import useNotificationStore from '@/stores/notification-store';

let connection: import('@microsoft/signalr').HubConnection | null = null;

export function ensureNotificationsConnection(apiBase: string, getToken: () => string | null) {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(`${apiBase}/hubs/notifications`, {
      accessTokenFactory: () => getToken() || ''
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  connection.on('conversationCompleted', ({ conversationId }: { conversationId: number; messageId: string }) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title: 'Response ready',
      message: `A response is ready in chat ${conversationId}`,
    });
  });

  connection.start().catch(() => {
    // Swallow errors; will auto-retry
  });

  return connection;
}


