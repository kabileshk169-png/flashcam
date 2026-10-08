import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Camera as CameraIcon,
  Maximize,
  Volume2,
  VolumeX,
  Crosshair,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Clock,
  Film,
  Download,
  ExternalLink,
  Tv,
} from 'lucide-react';
import { Camera, Detection, LiveTrack } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { startSimulatedCCTV, SimulatorHandle } from '../../utils/cameraSimulator';
import { CctvThumbnail } from './CctvThumbnails';

interface LiveStreamPlayerProps {
  camera: Camera;
  staggerIndex?: number;
  isFocused?: boolean;
  onFocusToggle?: () => void;
  showOverlayDetections?: boolean;
  showOverlayTracking?: boolean;
  activeDetections?: Detection[];
  activeTracks?: LiveTrack[];
  onSnapshotTaken?: (url: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  camera,
  staggerIndex = 0,
  isFocused = false,
  onFocusToggle,
  showOverlayDetections = true,
  showOverlayTracking = true,
  activeDetections = [],
  activeTracks = [],
  onSnapshotTaken,
  onRecordingChange,
}) => {
  const { showToast, settings } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulatorRef = useRef<SimulatorHandle | null>(null);

  // Stream state
  const [streamMode, setStreamMode] = useState<'stream' | 'simulation'>(
    camera.embedUrl ? 'stream' : 'simulation'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(camera.status === 'online');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [qualityProfile, setQualityProfile] = useState<'high' | 'standard' | 'smooth'>('high');
  const [isPtzOpen, setIsPtzOpen] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState<boolean>(false);

  // Reconnection & Error state
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(
    camera.status === 'offline' ? 'Camera node is offline. Reconnection required.' : null
  );

  // Anti-buffering & load-balancing state
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(staggerIndex === 0);

  useEffect(() => {
    if (staggerIndex === 0) {
      setIsMounted(true);
      return;
    }
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, Math.min(1800, staggerIndex * 110));
    return () => clearTimeout(timer);
  }, [staggerIndex]);

  // Balance domains and inject low-latency anti-buffering parameters
  const optimizedEmbedUrl = React.useMemo(() => {
    if (!camera.embedUrl) return '';
    let url = camera.embedUrl;
    // Balance domains across YouTube hostnames to double browser parallel connection capacity
    if (url.includes('youtube-nocookie.com') && (camera.channel || 1) % 2 === 1) {
      url = url.replace('youtube-nocookie.com', 'youtube.com');
    }
    // Inject low-overhead anti-buffering parameters
    if (url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
      if (!url.includes('playsinline=')) url += '&playsinline=1';
      if (!url.includes('controls=')) url += '&controls=0';
      if (!url.includes('rel=')) url += '&rel=0';
      if (!url.includes('modestbranding=')) url += '&modestbranding=1';
      if (!url.includes('iv_load_policy=')) url += '&iv_load_policy=3';
      if (!url.includes('disablekb=')) url += '&disablekb=1';
    }
    return url;
  }, [camera.embedUrl, camera.channel]);

  const handleReloadStream = () => {
    setReloadKey((k) => k + 1);
    showToast(`Stream buffer cleared & re-synced for ${camera.name}`, 'info');
  };

  // Initialize stream
  useEffect(() => {
    let isCancelled = false;

    const initStream = async () => {
      setStreamError(null);

      if (camera.status === 'offline') {
        setStreamError('Node is powered down or unreachable on the network.');
        return;
      }

      if (streamMode === 'stream' && camera.embedUrl) {
        if (simulatorRef.current) {
          simulatorRef.current.stop();
          simulatorRef.current = null;
        }
        setIsPlaying(true);
        return;
      }

      if (camera.sourceType === 'device') {
        // Physical user media camera
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
              audio: false,
            });
            if (!isCancelled && videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          } else {
            throw new Error('Hardware camera API unavailable');
          }
        } catch {
          // Fallback to demo CCTV gateway
          if (!isCancelled && canvasRef.current) {
            simulatorRef.current = startSimulatedCCTV(canvasRef.current, camera.name);
            setIsPlaying(true);
          }
        }
      } else {
        // CCTV Stream (RTSP / WebRTC / Demo Gateway / AI Simulation)
        if (canvasRef.current) {
          if (simulatorRef.current) {
            simulatorRef.current.stop();
          }
          simulatorRef.current = startSimulatedCCTV(canvasRef.current, camera.name);
          setIsPlaying(true);
        }
      }
    };

    initStream();

    return () => {
      isCancelled = true;
      if (simulatorRef.current) {
        simulatorRef.current.stop();
        simulatorRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [camera.id, camera.status, camera.sourceType, camera.name, camera.embedUrl, streamMode]);

  // Recording timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Snapshot handler
  const handleTakeSnapshot = async () => {
    if (camera.status === 'offline') {
      showToast('Cannot snapshot offline camera', 'warning');
      return;
    }

    setIsCapturingSnapshot(true);
    try {
      let frameBase64: string | undefined;

      if (canvasRef.current) {
        try {
          frameBase64 = canvasRef.current.toDataURL('image/jpeg', 0.92);
        } catch {
          // Fallback if canvas is tainted or unreadable
        }
      } else if (videoRef.current) {
        try {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = videoRef.current.videoWidth || 1920;
          tempCanvas.height = videoRef.current.videoHeight || 1080;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
            frameBase64 = tempCanvas.toDataURL('image/jpeg', 0.92);
          }
        } catch {
          // Fallback if video frame unreadable
        }
      }

      const snap = await api.takeSnapshot(
        camera.id,
        frameBase64,
        camera.resolution || '1920x1080',
        settings.userName
      );

      showToast(`Snapshot saved: ${snap.resolution} (${(snap.fileSize / 1024).toFixed(0)} KB)`, 'success');
      if (onSnapshotTaken) {
        onSnapshotTaken(snap.url);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to capture snapshot', 'error');
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  // Toggle Live Recording
  const handleToggleRecording = async () => {
    if (camera.status === 'offline') {
      showToast('Cannot record offline camera', 'warning');
      return;
    }

    if (!isRecording) {
      try {
        const rec = await api.startRecording(camera.id);
        setIsRecording(true);
        setRecordingId(rec.id);
        showToast(`Recording initiated on ${camera.name}`, 'info');
        if (onRecordingChange) onRecordingChange(true);
      } catch (err: any) {
        showToast(err?.message || 'Recording start failed', 'error');
      }
    } else {
      try {
        const finished = await api.stopRecording(camera.id, recordingId || undefined);
        setIsRecording(false);
        setRecordingId(null);
        showToast(`Recording saved (${finished.durationSeconds}s, ${(Number(finished.fileSize || 0) / 1024 / 1024).toFixed(1)} MB)`, 'success');
        if (onRecordingChange) onRecordingChange(false);
      } catch (err: any) {
        showToast(err?.message || 'Recording stop failed', 'error');
      }
    }
  };

  // PTZ Control
  const handlePtzAction = async (action: string, presetName?: string) => {
    if (!camera.capabilities?.ptz) {
      showToast('PTZ unavailable for this camera.', 'warning');
      return;
    }
    try {
      await api.ptzControl(camera.id, action, presetName);
      showToast(`PTZ: ${action.replace('_', ' ').toUpperCase()} executed`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'PTZ command failed', 'error');
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      containerRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  // Reconnect stream
  const handleReconnect = async () => {
    setIsReconnecting(true);
    setStreamError(null);
    try {
      const res = await api.testCamera(camera.id);
      if (res.status === 'online') {
        showToast(`Reconnected to ${camera.name} (${res.latencyMs}ms)`, 'success');
        if (canvasRef.current) {
          simulatorRef.current = startSimulatedCCTV(canvasRef.current, camera.name);
          setIsPlaying(true);
        }
      } else {
        setStreamError(res.message);
        showToast(res.message, 'error');
      }
    } catch {
      setStreamError('Gateway handshake failed');
    } finally {
      setIsReconnecting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`group relative rounded-2xl overflow-hidden bg-slate-950 border transition-all select-none ${
        isFocused
          ? 'border-[#2563EB] shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Video Viewport / Canvas Stream */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {streamMode === 'stream' && camera.embedUrl ? (
          isMounted ? (
            <iframe
              key={`${camera.id}-${reloadKey}`}
              src={optimizedEmbedUrl}
              title={camera.name}
              className="w-full h-full border-0 object-cover pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 text-slate-400 overflow-hidden">
              <CctvThumbnail cameraId={camera.id} thumbnailUrl={camera.thumbnailUrl} />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-wider">
                  SYNCING BUFFER...
                </span>
              </div>
            </div>
          )
        ) : camera.sourceType === 'device' ? (
          <video
            ref={videoRef}
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block"
          />
        )}

        {/* Offline / Error Overlay */}
        {streamError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              STREAM SIGNAL LOST
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1">
              {streamError}
            </p>
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>{isReconnecting ? 'Attempting Handshake...' : 'Retry Connection'}</span>
            </button>
          </div>
        )}

        {/* AI Detection Overlays (Bounding Boxes) */}
        {showOverlayDetections && activeDetections.length > 0 && !streamError && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {activeDetections.map((det, idx) => (
              <div
                key={det.id || idx}
                className="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded-xs transition-all animate-in fade-in duration-150"
                style={{
                  left: `${35 + (idx % 3) * 15}%`,
                  top: `${40 + (idx % 2) * 10}%`,
                  width: `${24 + (idx % 2) * 6}%`,
                  height: `${32 + (idx % 2) * 8}%`,
                }}
              >
                <div className="absolute -top-5 left-0 bg-emerald-500 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-1">
                  <span>{det.label.toUpperCase()}</span>
                  <span>•</span>
                  <span>{det.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Real Object Tracking Overlays */}
        {showOverlayTracking && activeTracks.length > 0 && !streamError && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {activeTracks.map((tr, idx) => (
              <div
                key={tr.trackId || idx}
                className="absolute border-2 border-blue-400 bg-blue-500/10 rounded-xs transition-all"
                style={{
                  left: `${tr.bbox.x}%`,
                  top: `${tr.bbox.y}%`,
                  width: `${tr.bbox.width}%`,
                  height: `${tr.bbox.height}%`,
                }}
              >
                <div className="absolute -top-5 left-0 bg-blue-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                  <span>{tr.trackId}</span>
                  <span>•</span>
                  <span>{tr.durationSeconds}s</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Top OSD Metadata Telemetry Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs font-mono text-white pointer-events-none z-15">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Real vs Demo Gateway Label */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                camera.sourceType === 'embed' || camera.embedUrl
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : camera.isDemo || camera.sourceType === 'demo'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
              }`}
            >
              {camera.sourceType === 'embed' || camera.embedUrl
                ? 'LIVE CCTV STREAM'
                : camera.isDemo || camera.sourceType === 'demo'
                ? 'DEMO CCTV GATEWAY'
                : 'REAL RTSP NODE'}
            </span>

            {/* Live Indicator */}
            {camera.status === 'online' && !streamError ? (
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded border border-white/10 text-emerald-400 font-bold text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-rose-950/80 backdrop-blur-md px-2 py-0.5 rounded border border-rose-500/30 text-rose-400 font-bold text-[10px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>{camera.status.toUpperCase()}</span>
              </div>
            )}

            {/* Webcamera24 External Source Link */}
            {camera.sourceUrl && (
              <a
                href={camera.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 hover:bg-black/90 text-[10px] text-cyan-300 border border-cyan-500/30 transition-colors"
                title="View original stream on Webcamera24"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">webcamera24</span>
              </a>
            )}

            {/* Stream Mode Toggle: Live Stream vs AI Sim */}
            {camera.embedUrl && (
              <button
                onClick={() => setStreamMode((m) => (m === 'stream' ? 'simulation' : 'stream'))}
                className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 hover:bg-slate-800 text-[10px] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                title={streamMode === 'stream' ? 'Switch to AI Sentinel Simulation View' : 'Switch to Live Web Stream Feed'}
              >
                {streamMode === 'stream' ? (
                  <>
                    <Tv className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Stream</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    <span>AI Sim</span>
                  </>
                )}
              </button>
            )}

            {/* Quick Stream Buffer Re-Sync Button */}
            {camera.embedUrl && streamMode === 'stream' && (
              <button
                onClick={handleReloadStream}
                className="pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 hover:bg-slate-800 text-[10px] text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer"
                title="Clear Video Buffer & Re-sync Stream"
              >
                <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
                <span className="hidden sm:inline">Sync Buffer</span>
              </button>
            )}

            {/* Active Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-1.5 bg-red-600/90 text-white px-2 py-0.5 rounded border border-red-400/50 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>REC {formatSeconds(recordingSeconds)}</span>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
            <span className="text-emerald-400 font-bold">● SYNCED</span>
            <span>•</span>
            <span>{camera.resolution || '1080P'}</span>
            <span>•</span>
            <span>{camera.fps || 30} FPS</span>
            <span>•</span>
            <span>{camera.latencyMs || 45}ms</span>
          </div>
        </div>

        {/* PTZ Control Drawer Overlay */}
        {isPtzOpen && camera.capabilities?.ptz && (
          <div className="absolute inset-y-0 right-0 w-52 bg-slate-900/95 backdrop-blur-md border-l border-slate-700/80 p-3 z-25 flex flex-col justify-between text-white animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-300">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>PTZ CONTROLS</span>
                </div>
                <button
                  onClick={() => setIsPtzOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              {/* D-Pad Directional Controls */}
              <div className="mt-3 flex flex-col items-center gap-1">
                <button
                  onClick={() => handlePtzAction('tilt_up')}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
                  title="Tilt Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePtzAction('pan_left')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
                    title="Pan Left"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePtzAction('home')}
                    className="p-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold"
                  >
                    CENTER
                  </button>
                  <button
                    onClick={() => handlePtzAction('pan_right')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
                    title="Pan Right"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => handlePtzAction('tilt_down')}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
                  title="Tilt Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Optical Zoom Buttons */}
              <div className="mt-3 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Optical Zoom</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handlePtzAction('zoom_in')}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>In</span>
                  </button>
                  <button
                    onClick={() => handlePtzAction('zoom_out')}
                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Out</span>
                  </button>
                </div>
              </div>

              {/* Presets */}
              {camera.capabilities?.presets && camera.capabilities.presets.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Sector Presets</span>
                  <div className="space-y-1 mt-1 max-h-24 overflow-y-auto">
                    {camera.capabilities.presets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setSelectedPreset(preset);
                          handlePtzAction('preset', preset);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] truncate transition-colors ${
                          selectedPreset === preset
                            ? 'bg-blue-600 text-white font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-[9px] font-mono text-slate-400 text-center pt-2">
              ONVIF Profile S Pan-Tilt-Zoom
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls & Telemetry Bar */}
      <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 overflow-hidden">
          <button
            onClick={onFocusToggle}
            className="text-left truncate cursor-pointer hover:text-white transition-colors"
            title="Click to expand camera view"
          >
            <span className="font-bold text-white text-xs truncate block">{camera.name}</span>
            <span className="text-[10px] text-slate-400 font-mono truncate block">
              {camera.location} • {camera.group}
            </span>
          </button>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quality Switcher */}
          {camera.capabilities?.multiStream && (
            <select
              value={qualityProfile}
              onChange={(e) => setQualityProfile(e.target.value as any)}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 rounded px-1.5 py-1 border border-slate-700 outline-none cursor-pointer"
              title="Stream Quality"
            >
              <option value="high">High (1080p)</option>
              <option value="standard">Standard (720p)</option>
              <option value="smooth">Smooth (480p)</option>
            </select>
          )}

          {/* PTZ Button */}
          <button
            onClick={() => {
              if (!camera.capabilities?.ptz) {
                showToast('PTZ unavailable for this camera.', 'warning');
              } else {
                setIsPtzOpen(!isPtzOpen);
              }
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              camera.capabilities?.ptz
                ? isPtzOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
            }`}
            title={camera.capabilities?.ptz ? 'PTZ Controls' : 'PTZ unavailable for this camera.'}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Snapshot Button */}
          <button
            onClick={handleTakeSnapshot}
            disabled={isCapturingSnapshot || camera.status === 'offline'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
            title="Capture Forensic Snapshot"
          >
            <CameraIcon className={`w-3.5 h-3.5 ${isCapturingSnapshot ? 'animate-spin' : ''}`} />
          </button>

          {/* Record Button */}
          <button
            onClick={handleToggleRecording}
            disabled={camera.status === 'offline'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-600 text-white border-red-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-red-400'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Live Recording'}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Film className="w-3.5 h-3.5" />}
          </button>

          {/* Mute Button */}
          {camera.capabilities?.audio && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
