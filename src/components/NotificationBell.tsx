import { trpc } from "@/utils/trpc";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
        refetchInterval: 10000, // Poll every 10 seconds
    });

    const { data: notifications, refetch } = trpc.notifications.list.useQuery();
    const markAsRead = trpc.notifications.markAsRead.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (notificationId: string, orderId: string) => {
        await markAsRead.mutateAsync({ notificationId });
        setIsOpen(false);
        // Navigate to orders page - the Link component will handle this
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-700" />
                {(unreadCount ?? 0) > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {(unreadCount ?? 0) > 0 && (
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                className="text-xs text-primary hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {!notifications || notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    href={`/orders`}
                                    onClick={() => handleNotificationClick(notification.id, notification.orderId)}
                                    className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-blue-50" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={`w-2 h-2 rounded-full ${!notification.read ? "bg-blue-600" : "bg-gray-300"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    {notifications && notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                            <Link
                                href="/orders"
                                className="text-sm text-primary hover:underline"
                                onClick={() => setIsOpen(false)}
                            >
                                View all orders
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
