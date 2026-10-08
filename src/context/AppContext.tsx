import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemMetrics, NotificationItem, UserSettings, SupportedLanguage, LanguageOption } from '../types';
import { api } from '../services/api';

export type AppRoute =
  | 'overview'
  | 'live'
  | 'ai-search'
  | 'demo-library'
  | 'video-verification'
  | 'ai-analysis'
  | 'investigations'
  | 'events'
  | 'cameras'
  | 'timeline'
  | 'reports'
  | 'settings';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'EN', name: 'English', native: 'English', sampleQuery: 'Did a red car pass through the main gate?' },
  { code: 'TA', name: 'Tamil', native: 'தமிழ்', sampleQuery: 'முக்கிய வாயில் வழியாக சிவப்பு கார் சென்றதா?' },
  { code: 'HI', name: 'Hindi', native: 'हिन्दी', sampleQuery: 'क्या कोई लाल कार मुख्य द्वार से गुजरी?' },
  { code: 'TE', name: 'Telugu', native: 'తెలుగు', sampleQuery: 'మెయిన్ గేట్ గుండా ఎరుపు రంగు కారు వెళ్లిందా?' },
  { code: 'KN', name: 'Kannada', native: 'ಕನ್ನಡ', sampleQuery: 'ಮುಖ್ಯ ದ್ವಾರದ ಮೂಲಕ ಕೆಂಪು ಕಾರು ಹಾದುಹೋಗಿದೆಯೇ?' },
  { code: 'ML', name: 'Malayalam', native: 'മലയാളം', sampleQuery: 'പ്രധാന ഗേറ്റിലൂടെ ചുവന്ന കാർ കടന്നുപോയോ?' },
];

interface AppContextType {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute, params?: { videoId?: string; cameraId?: string; seekSeconds?: number }) => void;
  metrics: SystemMetrics;
  refreshMetrics: () => Promise<void>;
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isAgentDrawerOpen: boolean;
  setIsAgentDrawerOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  selectedVideoId: string | null;
  setSelectedVideoId: (id: string | null) => void;
  selectedDemoId: string | null;
  setSelectedDemoId: (id: string | null) => void;
  seekTargetSeconds: number | null;
  setSeekTargetSeconds: (sec: number | null) => void;
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string | null) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialRoute = (): AppRoute => {
    const path = window.location.pathname.replace(/^\//, '');
    const validRoutes: AppRoute[] = [
      'overview',
      'live',
      'ai-search',
      'demo-library',
      'video-verification',
      'ai-analysis',
      'investigations',
      'events',
      'cameras',
      'timeline',
      'reports',
      'settings',
    ];
    if (validRoutes.includes(path as AppRoute)) return path as AppRoute;
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (validRoutes.includes(hash as AppRoute)) return hash as AppRoute;
    return 'overview';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('EN');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalCameras: 4,
    onlineCameras: 3,
    offlineCameras: 1,
    uploadedVideos: 1,
    detectedEvents: 0,
    activeAlerts: 0,
    systemStatus: 'optimal',
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>('demo-01-traffic');
  const [seekTargetSeconds, setSeekTargetSeconds] = useState<number | null>(null);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    userName: 'Chief Security Officer',
    userEmail: 'kabilehsk169@gmail.com',
    role: 'Administrator',
    detectionInterval: 3,
    confidenceThreshold: 65,
    aiModel: 'gemini-3.8-flash',
    voiceSpeed: 1.0,
    autoVoiceOutput: true,
    notificationsEnabled: true,
    soundAlerts: true,
    theme: 'navy',
  });

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const refreshMetrics = useCallback(async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.warn('Failed to fetch metrics:', err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
    refreshNotifications();
    refreshSettings();
    const interval = setInterval(() => {
      refreshMetrics();
      refreshNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshMetrics, refreshNotifications, refreshSettings]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback(
    (route: AppRoute, params?: { videoId?: string; cameraId?: string; seekSeconds?: number; demoId?: string }) => {
      setCurrentRoute(route);
      window.history.pushState({}, '', `/${route}`);
      if (params?.videoId) setSelectedVideoId(params.videoId);
      if (params?.demoId) setSelectedDemoId(params.demoId);
      if (params?.cameraId) setSelectedCameraId(params.cameraId);
      if (params?.seekSeconds !== undefined) setSeekTargetSeconds(params.seekSeconds);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateSettingsHandler = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      try {
        const updated = await api.updateSettings(newSettings);
        setSettings(updated);
        showToast('Settings saved successfully', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to update settings', 'error');
      }
    },
    [showToast]
  );

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [currentAudio]);

  const speakText = useCallback(
    async (text: string) => {
      if (!settings.autoVoiceOutput) return;
      stopSpeaking();
      setIsSpeaking(true);

      try {
        const ttsRes = await api.textToSpeech(text);
        if (ttsRes.available && ttsRes.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${ttsRes.audioBase64}`);
          audio.playbackRate = settings.voiceSpeed || 1.0;
          setCurrentAudio(audio);
          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentAudio(null);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            setCurrentAudio(null);
          };
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('Gemini TTS failed, falling back to Web Speech API:', err);
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const cleanText = text.replace(/[*_#`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = settings.voiceSpeed || 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    },
    [settings.autoVoiceOutput, settings.voiceSpeed, stopSpeaking]
  );

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigateTo,
        metrics,
        refreshMetrics,
        notifications,
        unreadNotificationCount,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isAgentDrawerOpen,
        setIsAgentDrawerOpen,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        selectedVideoId,
        setSelectedVideoId,
        selectedDemoId,
        setSelectedDemoId,
        seekTargetSeconds,
        setSeekTargetSeconds,
        selectedCameraId,
        setSelectedCameraId,
        toasts,
        showToast,
        settings,
        updateSettings: updateSettingsHandler,
        speakText,
        stopSpeaking,
        isSpeaking,
        currentLanguage,
        setLanguage: setCurrentLanguage,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
