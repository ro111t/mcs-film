"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, X, Check, Calendar, Briefcase, Megaphone, Info, Flag, UserCheck } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, any> = {
  info: Info,
  event: Calendar,
  job: Briefcase,
  rsvp: UserCheck,
  application: UserCheck,
  announcement: Megaphone,
  report: Flag,
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function NotificationBell() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }, [supabase]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Poll every 30s for new notifications
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    const ids = unread.map((n) => n.id);
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const clearAll = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").delete().in("id", ids);
    setNotifications([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative rounded-lg p-2 text-muted transition-all duration-300 hover:bg-surface-light hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-medium text-accent hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] font-medium text-muted hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-border-light" />
                  <p className="text-xs text-muted">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.notification_type] || Info;
                  const content = (
                    <div
                      className={`flex gap-3 px-4 py-3 transition-all hover:bg-surface-light ${!notif.is_read ? "bg-accent/[0.03]" : ""}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${!notif.is_read ? "bg-accent/10" : "bg-surface-light"}`}>
                        <Icon className={`h-3.5 w-3.5 ${!notif.is_read ? "text-accent" : "text-muted"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${!notif.is_read ? "text-foreground" : "text-muted"}`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="mt-0.5 text-[11px] text-muted line-clamp-2">{notif.body}</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted/60">{timeAgo(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                  );

                  return notif.link ? (
                    <Link key={notif.id} href={notif.link} onClick={() => { markAsRead(notif.id); setOpen(false); }}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notif.id}>{content}</div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
