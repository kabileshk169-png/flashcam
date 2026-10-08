import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Search,
  FileVideo,
  Film,
  Sparkles,
  Bell,
  Video,
  Clock,
  BarChart3,
  Settings,
  Shield,
  Mic,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';

interface NavItem {
  id: AppRoute;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeType?: 'blue' | 'red' | 'gray';
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentRoute, navigateTo, metrics, settings, setIsVoiceModalOpen } = useApp();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Radio },
    { id: 'ai-search', label: 'Video Search', icon: Search },
    {
      id: 'demo-library',
      label: 'Real-World Demos',
      icon: Film,
      badge: '7 Demos',
      badgeType: 'blue',
    },
    {
      id: 'video-verification',
      label: 'Video Verification',
      icon: FileVideo,
      badge: metrics.uploadedVideos > 0 ? metrics.uploadedVideos : 1,
      badgeType: 'blue',
    },
    { id: 'ai-analysis', label: 'AI Analysis', icon: Sparkles },
    {
      id: 'events',
      label: 'Events & Alerts',
      icon: Bell,
      badge: metrics.activeAlerts > 0 ? metrics.activeAlerts : 2,
      badgeType: 'red',
    },
    {
      id: 'cameras',
      label: 'Cameras',
      icon: Video,
      badge: `${metrics.onlineCameras}/${metrics.totalCameras}`,
      badgeType: 'gray',
    },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#061A33] border-r border-[#0d2a4e] text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #061A33 0%, #082142 50%, #092A4A 100%)',
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[#12335a]/60">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 text-white shadow-lg shadow-teal-500/20 border border-teal-300/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white text-base leading-none">
              FLASH CAM
            </h1>
            <p className="text-[11px] text-teal-300/80 font-medium mt-1">
              AI Powered Surveillance
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  navigateTo(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#08A6B5] to-[#0ea5e9] text-white shadow-md shadow-cyan-500/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badgeType === 'red'
                        ? 'bg-rose-500 text-white'
                        : item.badgeType === 'blue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Voice Assistant Promo Card */}
        <div className="px-3.5 pb-3">
          <div
            onClick={() => setIsVoiceModalOpen(true)}
            className="cursor-pointer p-3 rounded-xl bg-gradient-to-r from-[#0d2a4e] to-[#0a2342] border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-xs">
                <Mic className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  Voice Assistant
                </p>
                <p className="text-[10px] text-slate-400">Ask in any language</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* User Session Footer */}
        <div className="p-3.5 border-t border-[#12335a]/60 bg-[#061A33]/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                CH
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {settings.userName || 'Chief Security Officer'}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {settings.role || 'Administrator'}
                </p>
              </div>
            </div>

            <button
              title="Logout / Settings"
              onClick={() => navigateTo('settings')}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
