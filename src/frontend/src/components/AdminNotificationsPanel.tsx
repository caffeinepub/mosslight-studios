import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCheck, X } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  useGetUnreadNotifications,
  useMarkNotificationAsRead,
} from "../hooks/useNotifications";

const STORAGE_KEY = "adminDismissedNotifs";

function loadDismissedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveDismissedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export default function AdminNotificationsPanel() {
  const { data: notifications = [], isLoading } = useGetUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const [dismissedIds, setDismissedIds] = useState<string[]>(() =>
    loadDismissedIds(),
  );

  const adminNotifications = notifications.filter(
    (n) =>
      n.notifType.__kind__ === "adminAlert" ||
      n.notifType.__kind__ === "lowInventory",
  );

  const visibleNotifications = adminNotifications.filter(
    (n) => !dismissedIds.includes(n.id),
  );

  const dismissOne = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    saveDismissedIds(updated);
    // Best-effort backend call — ignore errors
    markAsRead.mutate(id);
  };

  const dismissAll = () => {
    const allIds = visibleNotifications.map((n) => n.id);
    const updated = [...dismissedIds, ...allIds];
    setDismissedIds(updated);
    saveDismissedIds(updated);
    for (const id of allIds) markAsRead.mutate(id);
  };

  if (isLoading) {
    return (
      <Card data-ocid="admin.notifications.panel">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getIcon = (type: { __kind__: string }) => {
    if (type.__kind__ === "lowInventory") {
      return <AlertTriangle className="h-5 w-5 shrink-0" />;
    }
    return <AlertCircle className="h-5 w-5 shrink-0" />;
  };

  const getVariant = (type: { __kind__: string }):
    | "default"
    | "destructive" => {
    if (type.__kind__ === "lowInventory") {
      return "destructive";
    }
    return "default";
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  return (
    <Card
      className="border-amber-200 dark:border-amber-800"
      data-ocid="admin.notifications.panel"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Admin Alerts
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {visibleNotifications.length}
            </span>
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={dismissAll}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 gap-1.5 text-xs"
            data-ocid="admin.notifications.dismiss_all_button"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Dismiss All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNotifications.map((notification, index) => (
          <Alert
            key={notification.id}
            variant={getVariant(notification.notifType)}
            data-ocid={`admin.notification.item.${index + 1}`}
          >
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
                onClick={() => dismissOne(notification.id)}
                title="Mark as seen"
                className="shrink-0 h-7 w-7 p-0 rounded-full opacity-60 hover:opacity-100 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-all"
                data-ocid={`admin.notification.dismiss_button.${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Mark as seen</span>
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
