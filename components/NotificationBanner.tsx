
import React, { useState, useEffect } from 'react';
import { MegaphoneIcon, XIcon } from './icons';

interface Notification {
    id: number;
    message: string;
}

const NotificationBanner: React.FC = () => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const storedNotification = localStorage.getItem('globalNotification');
            const dismissedId = localStorage.getItem('dismissedNotificationId');

            if (storedNotification) {
                const parsedNotification: Notification = JSON.parse(storedNotification);
                setNotification(parsedNotification);

                if (String(parsedNotification.id) !== dismissedId) {
                    setIsVisible(true);
                }
            } else {
                setIsVisible(false);
            }
        } catch (error) {
            console.error("Failed to parse notification from localStorage", error);
        }
    }, []); 

    const handleDismiss = () => {
        if (notification) {
            localStorage.setItem('dismissedNotificationId', String(notification.id));
            setIsVisible(false);
        }
    };

    if (!isVisible || !notification) {
        return null;
    }

    return (
        <div className="w-full bg-purple-600 text-white rounded-lg shadow-lg mb-6 z-30">
            <div className="py-3 px-4 sm:px-6">
                <div className="flex items-center justify-between flex-wrap">
                    <div className="w-0 flex-1 flex items-center">
                        <span className="flex p-2 rounded-lg bg-purple-800">
                            <MegaphoneIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="ml-3 font-medium text-sm">
                            {notification.message}
                        </p>
                    </div>
                    <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                        <button
                            type="button"
                            className="-mr-1 flex p-2 rounded-md hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
                            onClick={handleDismiss}
                            aria-label="Dismiss notification"
                        >
                            <XIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationBanner;