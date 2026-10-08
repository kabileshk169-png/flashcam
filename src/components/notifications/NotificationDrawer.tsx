import React from 'react';
import {
  Bell,
  CheckCheck,
  X,
  AlertTriangle,
  Video,
  FileVideo,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isNotificationsOpen,
    setIsNotificationsOpen,
    markNotificationRead,
    markAllNotificationsRead,
    navigateTo,
  } = useApp();

  if (!isNotificationsOpen) return null;

  const handleNotificationClick = (notif: any) => {
    markNotificationRead(notif.id);
    if (notif.link) {
      const route = notif.link.replace(/^\//, '');
      navigateTo(route as any);
      setIsNotificationsOpen(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'critical_alert':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'camera_offline':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'camera_online':
        return <Video className="w-4 h-4 text-emerald-400" />;
      case 'video_processed':
        return <FileVideo className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Notifications Center</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {notifications.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={markAllNotificationsRead}
                title="Mark all read"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>All Read</span>
              </button>
            )}
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[11px] text-slate-600">Real-time alerts and system events appear here.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`pt-2.5 first:pt-0 cursor-pointer p-2.5 rounded-lg border transition-all ${
                  notif.read
                    ? 'bg-slate-900/30 border-transparent hover:bg-slate-900/70 hover:border-slate-800'
                    : 'bg-slate-900/80 border-blue-500/30 hover:border-blue-500/60 shadow-xs shadow-blue-500/10'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-slate-800 shrink-0">
                    {getCategoryIcon(notif.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
