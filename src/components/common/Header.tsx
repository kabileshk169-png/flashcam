import React, { useState } from 'react';
import {
  Menu,
  Search,
  Camera,
  Mic,
  Globe,
  Maximize,
  Minimize,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useApp, LANGUAGE_OPTIONS } from '../../context/AppContext';
import { SupportedLanguage } from '../../types';

export const Header: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const {
    navigateTo,
    unreadNotificationCount,
    isNotificationsOpen,
    setIsNotificationsOpen,
    setIsVoiceModalOpen,
    currentLanguage,
    setLanguage,
    isFullscreen,
    toggleFullscreen,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo('ai-search');
      window.location.hash = `#q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-6 bg-white border-b border-[#DCE6F0] shadow-xs">
      {/* Left Area: Mobile Toggle + Global AI Video Search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Exact reference style) */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search videos... (e.g., "red car at main gate", "person with bag")'
            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#102A43] placeholder-slate-400 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
          />
          <button
            type="button"
            onClick={() => navigateTo('live')}
            title="Search by camera lens / snapshot"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2563EB] transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Area: Voice Search, Language, Fullscreen, Notifications, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-2">
        {/* Prominent Voice Search Button (Exact reference style) */}
        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-102 cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Voice Search</span>
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#102A43] text-xs font-semibold transition-colors"
          >
            <Globe className="w-4 h-4 text-slate-600" />
            <span>{currentLanguage}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isLangDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#DCE6F0] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Language
              </div>
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as SupportedLanguage);
                    setIsLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left hover:bg-slate-50 transition-colors ${
                    currentLanguage === lang.code ? 'text-[#2563EB] font-bold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-[11px] font-mono text-slate-400">{lang.native}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 hover:text-[#102A43] transition-colors"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notification Center"
            className="relative p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 hover:text-[#102A43] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white shadow-xs">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

        {/* User Avatar Circle */}
        <div
          onClick={() => navigateTo('settings')}
          className="cursor-pointer w-9 h-9 rounded-full bg-[#061A33] border-2 border-[#DCE6F0] flex items-center justify-center text-white font-semibold text-xs shadow-xs hover:border-[#2563EB] transition-colors"
          title={settings.userName}
        >
          {settings.userName ? settings.userName.slice(0, 2).toUpperCase() : 'CS'}
        </div>
      </div>
    </header>
  );
};
