import { useGetUnreadNotifications, useMarkNotificationAsRead } from '../hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Package, Check } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function AdminNotificationsPanel() {
  const { data: notifications = [], isLoading } = useGetUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const adminNotifications = notifications.filter(
    (n) => n.notifType.__kind__ === 'adminAlert' || n.notifType.__kind__ === 'lowInventory'
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (adminNotifications.length === 0) {
    return null;
  }

  const getIcon = (type: any) => {
    if (type.__kind__ === 'lowInventory') {
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  const getVariant = (type: any): 'default' | 'destructive' => {
    if (type.__kind__ === 'lowInventory') {
      return 'destructive';
    }
    return 'default';
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          Admin Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {adminNotifications.map((notification) => (
          <Alert key={notification.id} variant={getVariant(notification.notifType)}>
            <div className="flex items-start gap-3">
              {getIcon(notification.notifType)}
              <div className="flex-1 space-y-1">
                <AlertDescription className="text-sm">
                  {notification.message}
                </AlertDescription>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(notification.timestamp)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAsRead.mutate(notification.id)}
                disabled={markAsRead.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
