import React, { useState, useEffect } from 'react';
import {
  Video,
  Wifi,
  VideoOff,
  FileVideo,
  Sparkles,
  Bell,
  Camera,
  Calendar,
  Radio,
  ArrowRight,
  LayoutGrid,
  List,
  Maximize2,
  CheckCircle2,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Camera as CameraType, SecurityEvent, SecurityAlert } from '../types';
import { CctvThumbnail } from '../components/camera/CctvThumbnails';
import { MotionHeatmapOverlay } from '../components/camera/MotionHeatmapOverlay';

export const OverviewPage: React.FC = () => {
  const { metrics, navigateTo, setSelectedCameraId, showToast, toggleFullscreen } = useApp();

  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<SecurityAlert[]>([]);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [currentDateStr, setCurrentDateStr] = useState('Oct 08, 2026');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cams, evts, alts] = await Promise.all([
          api.getCameras(),
          api.getEvents(),
          api.getAlerts(),
        ]);
        setCameras(cams);
        setRecentEvents(evts.slice(0, 6));
        setActiveAlerts(alts.filter((a) => a.status === 'active').slice(0, 6));
      } catch (err) {
        console.warn('Overview fetch error:', err);
      }
    };
    fetchData();
  }, []);

  const handleCameraClick = (cam: CameraType) => {
    setSelectedCameraId(cam.id);
    navigateTo('live');
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId, 'Chief Security Officer');
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
      showToast('Security Alert acknowledged', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to acknowledge alert', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Exact match to reference image) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#102A43] tracking-tight">
            Surveillance Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-normal">
            Real-time multi-channel surveillance, AI verified threat streams & system health
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* UTC Clock pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#DCE6F0] shadow-xs text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-[#102A43]">{currentDateStr}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono text-slate-600">{currentTimeStr} (UTC)</span>
          </div>

          {/* Open Live Grid Button (Green) */}
          <button
            onClick={() => navigateTo('live')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold shadow-sm shadow-emerald-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
            <span>Open Live Grid</span>
          </button>

          {/* Verify Recorded Video Button (Blue) */}
          <button
            onClick={() => navigateTo('video-verification')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <FileVideo className="w-3.5 h-3.5 text-white" />
            <span>Verify Recorded Video</span>
          </button>
        </div>
      </div>

      {/* 2. Six Metric Cards with Mini Sparklines (Exact match to reference) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Cameras */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Total Cameras</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Video className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102A43] tracking-tight">
            {metrics.totalCameras}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-[#64748B]">Configured nodes</span>
            {/* Mini sparkline bars */}
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-2 bg-blue-300 rounded-xs" />
              <span className="w-1 h-3 bg-blue-400 rounded-xs" />
              <span className="w-1 h-4 bg-blue-600 rounded-xs" />
              <span className="w-1 h-3 bg-blue-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Metric 2: Online Streams */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Online Streams</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#10B981] tracking-tight">
            {metrics.onlineCameras}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-emerald-600">Active transmission</span>
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-2.5 bg-emerald-300 rounded-xs" />
              <span className="w-1 h-4 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-3.5 bg-emerald-500 rounded-xs" />
              <span className="w-1 h-4 bg-emerald-600 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Metric 3: Offline Streams */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Offline Streams</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#EF4444] tracking-tight">
            {metrics.offlineCameras}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-rose-500">Reconnection required</span>
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-3 bg-rose-300 rounded-xs" />
              <span className="w-1 h-2 bg-rose-400 rounded-xs" />
              <span className="w-1 h-4 bg-rose-500 rounded-xs" />
              <span className="w-1 h-2 bg-rose-300 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Metric 4: Uploaded Videos */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Uploaded Videos</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-[#08A6B5] flex items-center justify-center border border-cyan-100">
              <FileVideo className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102A43] tracking-tight">
            {metrics.uploadedVideos > 0 ? metrics.uploadedVideos : 1}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-[#08A6B5]">Ready for verification</span>
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-2 bg-cyan-300 rounded-xs" />
              <span className="w-1 h-3 bg-cyan-400 rounded-xs" />
              <span className="w-1 h-4 bg-cyan-500 rounded-xs" />
              <span className="w-1 h-2.5 bg-cyan-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Metric 5: Detected Events */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Detected Events</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#8B5CF6] flex items-center justify-center border border-purple-100">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#102A43] tracking-tight">
            {metrics.detectedEvents}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-purple-600">AI indexed tags</span>
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-1.5 bg-purple-300 rounded-xs" />
              <span className="w-1 h-2.5 bg-purple-400 rounded-xs" />
              <span className="w-1 h-3.5 bg-purple-500 rounded-xs" />
              <span className="w-1 h-2 bg-purple-400 rounded-xs" />
            </div>
          </div>
        </div>

        {/* Metric 6: Active Alerts */}
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium text-slate-600">Active Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
              <Bell className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#EF4444] tracking-tight">
            {metrics.activeAlerts}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-rose-600">Requires review</span>
            <div className="flex items-end gap-0.5 h-4 opacity-75">
              <span className="w-1 h-2 bg-rose-300 rounded-xs" />
              <span className="w-1 h-3 bg-rose-400 rounded-xs" />
              <span className="w-1 h-4 bg-rose-500 rounded-xs" />
              <span className="w-1 h-2.5 bg-rose-400 rounded-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Camera Grid Section (Exact match to reference) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
              <Camera className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#102A43]">
              Live Camera Grid{' '}
              <span className="text-xs font-normal text-[#64748B]">({Math.min(4, cameras.length || 4)} nodes)</span>
            </h2>
          </div>

          {/* Grid Toolbar: View All, Grid/List toggle, Fullscreen, Heatmap toggle */}
          <div className="flex items-center gap-2.5">
            {/* Heatmap overlay button */}
            <button
              onClick={() => {
                setIsHeatmapActive(!isHeatmapActive);
                showToast(
                  !isHeatmapActive
                    ? '1-Hour Motion Heatmap Overlay Activated'
                    : 'Motion Heatmap Overlay Deactivated',
                  'info'
                );
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isHeatmapActive
                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                  : 'bg-white text-slate-600 border-[#DCE6F0] hover:bg-slate-50'
              }`}
              title="Toggle 1-Hour Motion Heatmap Overlay"
            >
              <Flame className={`w-3.5 h-3.5 ${isHeatmapActive ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
              <span>{isHeatmapActive ? 'Heatmap: ON' : 'Heatmap'}</span>
            </button>

            <button
              onClick={() => navigateTo('cameras')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors mr-1"
            >
              <span>View All Cameras</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Grid vs List view toggle buttons */}
            <div className="flex items-center bg-white border border-[#DCE6F0] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen icon */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white border border-[#DCE6F0] text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Camera Cards (Exact CCTV layout and content from reference image) */}
        <div
          className={`grid gap-4.5 ${
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {cameras.slice(0, 4).map((cam) => {
            const isOnline = cam.status === 'online' && cam.enabled;

            return (
              <div
                key={cam.id}
                onClick={() => handleCameraClick(cam)}
                className="group cursor-pointer rounded-2xl bg-white border border-[#DCE6F0] shadow-sm hover:shadow-md hover:border-[#2563EB]/40 transition-all overflow-hidden"
              >
                {/* Viewport Thumbnail Area */}
                <div className="relative aspect-video bg-[#0f172a] overflow-hidden">
                  {/* High fidelity CCTV view */}
                  <CctvThumbnail cameraId={cam.id} />

                  {/* Motion Heatmap Overlay if toggled */}
                  {isHeatmapActive && (
                    <MotionHeatmapOverlay cameraId={cam.id} showLabels={false} />
                  )}

                  {/* Top Bar Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                    {isOnline ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#10B981] text-white text-[10px] font-bold tracking-wider shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EF4444] text-white text-[10px] font-bold tracking-wider shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        OFFLINE
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono border border-white/10">
                      {cam.resolution || '1920×1080'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono border border-white/10">
                      {cam.fps || 30} FPS
                    </span>
                  </div>

                  {/* Bottom Black CCTV info strip (Exact match to reference) */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs px-3 py-1 text-[10px] font-mono text-slate-300 flex items-center justify-between z-20 border-t border-white/10">
                    <span className="truncate">
                      {cam.id.toUpperCase()} • {cam.location}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="p-3.5 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#102A43] truncate group-hover:text-[#2563EB] transition-colors">
                      {cam.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5 font-normal">
                      {cam.group}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCameraClick(cam);
                    }}
                    className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-[#2563EB] flex items-center justify-center transition-colors shrink-0"
                    title="Open Camera Feed"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Row: Active Security Alerts & Recent Detected Events (Exact match to reference) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
        {/* Left: Active Security Alerts */}
        <div className="rounded-2xl bg-white border border-[#DCE6F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center border border-rose-100">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-[#102A43]">Active Security Alerts</h3>
            </div>
            <button
              onClick={() => navigateTo('events')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              View All ({activeAlerts.length})
            </button>
          </div>

          {/* Content state */}
          {activeAlerts.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center mb-3 border border-emerald-100 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
              <h4 className="text-sm font-semibold text-[#102A43]">All Security Sectors Clear</h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                No active priority rule triggers at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-rose-300 transition-all flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700">
                        {alert.severity}
                      </span>
                      <p className="text-xs font-semibold text-[#102A43]">{alert.ruleName}</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      {alert.cameraName} • {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 transition-colors shrink-0"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Detected Events */}
        <div className="rounded-2xl bg-white border border-[#DCE6F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-[#102A43]">Recent Detected Events</h3>
            </div>
            <button
              onClick={() => navigateTo('events')}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition-colors"
            >
              <span>All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content state */}
          {recentEvents.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              {/* Subtle ECG / wave line icon matching reference */}
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3 border border-slate-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-slate-400">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-[#102A43]">No Events Logged Yet</h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm">
                Upload a video in Video Verification or start Live Camera to analyze events.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigateTo('events')}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {evt.evidenceFrameUrl ? (
                      <img
                        src={evt.evidenceFrameUrl}
                        alt="Evt"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                        className="w-12 h-9 object-cover rounded-lg bg-slate-200 shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#102A43] truncate">{evt.type}</p>
                      <p className="text-[11px] text-slate-500 truncate">{evt.description}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {evt.cameraName || evt.videoTitle || 'Channel'} • {new Date(evt.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-slate-700 bg-white border border-slate-200 shrink-0">
                    {evt.confidence}% CONF
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
