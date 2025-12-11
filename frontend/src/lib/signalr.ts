import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import useNotificationStore from '@/stores/notification-store';

let connection: import('@microsoft/signalr').HubConnection | null = null;

export async function ensureNotificationsConnection(apiBase: string, getToken: () => string | null) {
  // Do not start connection until we have a token; avoids immediate 401/auto-retry loops
  const token = getToken();
  if (!token) return null;
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(`${apiBase}/hubs/notifications`, {
      accessTokenFactory: () => getToken() || '',
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

  try {
    await connection.start();
  } catch (error) {
    // Leave connection null so a later auth state change can retry cleanly
    connection = null;
    console.error('Failed to start notifications connection', error);
  }

  return connection;
}

export async function stopNotificationsConnection() {
  if (!connection) return;
  const current = connection;
  connection = null;
  try {
    await current.stop();
  } catch {
    // ignore stop errors
  }
}


