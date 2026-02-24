import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetUnreadNotifications, useMarkNotificationAsRead } from '../hooks/useNotifications';
import { AlertCircle, Package, AlertTriangle } from 'lucide-react';

export default function NotificationBell() {
  const { data: notifications = [] } = useGetUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const getNotificationIcon = (type: any) => {
    if (type.__kind__ === 'orderUpdate') {
      return <Package className="h-4 w-4 text-blue-600" />;
    } else if (type.__kind__ === 'lowInventory') {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-purple-600" />;
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="px-3 py-3 cursor-pointer focus:bg-muted"
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex gap-3 w-full">
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.notifType)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-snug">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
