import {useEffect, useRef} from 'react';
import {toast} from 'sonner';
import useNotificationStore from '@/stores/notification-store';

const Notifications = () => {
    const {notifications, dismissNotification} = useNotificationStore();
    const displayedNotifications = useRef<string[]>([]);

    useEffect(() => {
        notifications.forEach((notification) => {
            if (displayedNotifications.current.includes(notification.id)) {
                return;
            }

            toast[notification.type](notification.title, {
                description: notification.message,
                id: notification.id,
                onDismiss: () => {
                    // This will be called by sonner when the toast is dismissed.
                    // We also need to remove it from our tracking ref.
                    displayedNotifications.current = displayedNotifications.current.filter(
                        (id) => id !== notification.id,
                    );
                    dismissNotification(notification.id);
                },
                onAutoClose: () => {
                    // onDismiss is called on auto close as well, so we only need one handler.
                }
            });
            displayedNotifications.current.push(notification.id);
        });
        // We only want this to run when the notifications array instance changes.
    }, [notifications, dismissNotification]);

    return null;
};

export default Notifications; 