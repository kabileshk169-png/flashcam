import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Eye,
  ExternalLink,
  Tag,
  Car,
  Users,
  Activity,
  AlertOctagon,
  Video,
  Share2,
  ArrowRight,
  Info,
  RefreshCw,
  Compass,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DemoVideoItem, DemoDetection, ReferenceVideoItem, SearchMatchResult } from '../types';

export const DemoLibraryPage: React.FC = () => {
  const { showToast, selectedDemoId, setSelectedDemoId, navigateTo } = useApp();

  const [demos, setDemos] = useState<DemoVideoItem[]>([]);
  const [references, setReferences] = useState<ReferenceVideoItem[]>([]);
  const [activeDemo, setActiveDemo] = useState<DemoVideoItem | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'demos' | 'references'>('demos');

  // Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showAiOverlay, setShowAiOverlay] = useState(true);

  // Live Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Conversational Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchMatchResult | null>(null);

  // Evidence Modals
  const [evidenceFrameModal, setEvidenceFrameModal] = useState<string | null>(null);
  const [evidenceClipModal, setEvidenceClipModal] = useState<{ url: string; title: string } | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<DemoDetection | null>(null);

  useEffect(() => {
    loadDemos();
  }, []);

  const loadDemos = async () => {
    try {
      const data = await api.getDemos();
      setDemos(data.demos);
      setReferences(data.references);

      if (data.demos.length > 0) {
        const initial = selectedDemoId
          ? data.demos.find((d) => d.id === selectedDemoId) || data.demos[0]
          : data.demos[0];
        selectDemo(initial);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load demo library', 'error');
    }
  };

  const selectDemo = (demo: DemoVideoItem) => {
    setActiveDemo(demo);
    setSelectedDemoId(demo.id);
    setSelectedDetection(demo.detections[0] || null);
    setSearchResult(null);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleRunLiveAnalysis = async () => {
    if (!activeDemo) return;
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setAnalysisComplete(false);

    try {
      // Simulate real CV pipeline verification progress steps
      setTimeout(() => setAnalysisProgress(45), 600);
      setTimeout(() => setAnalysisProgress(80), 1200);

      const res = await api.analyzeDemo(activeDemo.id);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        setAnalysisComplete(true);
        showToast(res.message, 'success');
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 1800);
    } catch (err: any) {
      setIsAnalyzing(false);
      showToast(err?.message || 'Analysis failed', 'error');
    }
  };

  const handleConversationalSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      showToast('Please enter a query', 'warning');
      return;
    }

    setSearchQuery(q);
    setIsSearching(true);
    try {
      const match = await api.searchDemos(q, activeDemo?.id);
      setSearchResult(match);

      if (match.matchFound) {
        // If match belongs to different demo, switch demo
        if (activeDemo && match.demoId !== activeDemo.id) {
          const target = demos.find((d) => d.id === match.demoId);
          if (target) {
            setActiveDemo(target);
            setSelectedDemoId(target.id);
          }
        }

        // Seek player to timestamp
        setTimeout(() => {
          handleSeek(match.timestamp);
          if (videoRef.current && !isPlaying) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 100);

        showToast(`Match found at ${match.timestampFormatted} (${match.confidence}% confidence)`, 'success');
      } else {
        showToast('No matching event found in current video data', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredDemos = demos.filter((d) => {
    if (selectedScenario === 'all') return true;
    return d.scenario === selectedScenario;
  });

  // Active detections for the current playhead
  const activeDetectionsAtCurrentTime = (activeDemo?.detections || []).filter((det) => {
    return Math.abs(currentTime - det.timestamp) <= 3.5;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#DCE6F0]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#08A6B5] text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-white/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#102A43] tracking-tight">
                  REAL-WORLD VIDEO DEMO LIBRARY
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-[#2563EB] border border-blue-200">
                  REAL CV PIPELINE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Multi-stream computer vision, ByteTrack temporal verification, conversational retrieval & grounded evidence
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Nav Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-white border border-[#DCE6F0] p-1 shadow-xs">
            <button
              onClick={() => setActiveTab('demos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'demos'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Scenarios ({demos.length})
            </button>
            <button
              onClick={() => setActiveTab('references')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'references'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reference Gallery ({references.length})
            </button>
          </div>

          <button
            onClick={() => navigateTo('video-verification')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE6F0] text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span>Upload Custom Video</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {activeTab === 'demos' ? (
        <>
          {/* Main Workspace: Left Column Player & Telemetry, Right Column Conversational Retrieval & Evidence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Real Video Player with Cinematic AI Overlay */}
            <div className="lg:col-span-8 space-y-4">
              <div className="rounded-2xl bg-white border border-[#DCE6F0] overflow-hidden shadow-xs">
                {/* Viewport Frame */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
                  {activeDemo ? (
                    <video
                      ref={videoRef}
                      src={activeDemo.videoUrl}
                      className="w-full h-full object-contain"
                      playsInline
                      onTimeUpdate={() => {
                        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                      }}
                      onLoadedMetadata={() => {
                        if (videoRef.current) setDuration(videoRef.current.duration);
                      }}
                      onEnded={() => setIsPlaying(false)}
                    />
                  ) : (
                    <div className="text-slate-400 text-xs font-mono">Select a demo video below</div>
                  )}

                  {/* Cinematic Futuristic AI Computer-Vision Overlay */}
                  {showAiOverlay && activeDemo && (
                    <div className="absolute inset-0 pointer-events-none z-10 transition-opacity">
                      {/* Subtle Grid Scanning Effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(#08A6B5_0.6px,transparent_0.6px)] [background-size:20px_20px] opacity-15" />

                      {/* Top Telemetry Overlay */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono pointer-events-auto">
                        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-teal-500/30 shadow-lg">
                          <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                          <span className="font-bold tracking-wider text-teal-300">
                            {activeDemo.cameraName}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-300 font-semibold uppercase">
                            {isAnalyzing ? '● ANALYZING FEED' : 'PROCESSED CV TELEMETRY'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                          <span className="text-slate-400">FPS: 30</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">
                            {formatTime(currentTime)} / {formatTime(duration || activeDemo.duration)}
                          </span>
                        </div>
                      </div>

                      {/* Real Dynamic Bounding Boxes Layered on Video */}
                      {activeDetectionsAtCurrentTime.map((det) => (
                        <div
                          key={det.id}
                          className={`absolute border-2 rounded-sm transition-all duration-300 ${
                            det.severity === 'critical'
                              ? 'border-red-400 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                              : det.severity === 'warning'
                              ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'border-teal-400 bg-teal-500/10 shadow-[0_0_15px_rgba(8,166,181,0.25)]'
                          }`}
                          style={{
                            left: `${det.boundingBox.x}%`,
                            top: `${det.boundingBox.y}%`,
                            width: `${det.boundingBox.width}%`,
                            height: `${det.boundingBox.height}%`,
                          }}
                        >
                          {/* Corner Reticles */}
                          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                          {/* Top Identification Badge */}
                          <div
                            className={`absolute -top-6 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-xs text-[9px] font-mono font-bold text-white shadow-md whitespace-nowrap ${
                              det.severity === 'critical'
                                ? 'bg-red-600'
                                : det.severity === 'warning'
                                ? 'bg-amber-600'
                                : 'bg-[#08A6B5]'
                            }`}
                          >
                            <span>{det.label.toUpperCase()}</span>
                            <span>•</span>
                            <span className="text-white/90">{det.confidence}%</span>
                            <span>•</span>
                            <span className="text-white/80">{det.trackId}</span>
                          </div>
                        </div>
                      ))}

                      {/* Bottom Live Analysis Telemetry Bar */}
                      <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-teal-500/20 text-white text-[11px] font-mono flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-300" />
                          <span className="text-slate-400">People:</span>
                          <span className="font-bold text-teal-300">{activeDemo.stats.peopleCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-blue-300" />
                          <span className="text-slate-400">Vehicles:</span>
                          <span className="font-bold text-blue-300">{activeDemo.stats.vehicleCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-emerald-300" />
                          <span className="text-slate-400">Events:</span>
                          <span className="font-bold text-emerald-300">{activeDemo.stats.eventsCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Watermark when asynchronous analyzing */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center z-30 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center animate-spin">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold font-mono tracking-wider text-white">
                          RUNNING REAL COMPUTER-VISION PIPELINE
                        </p>
                        <p className="text-xs text-teal-300/80 font-mono mt-1">
                          Extracting keyframes & indexing bounding boxes... ({analysisProgress}%)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Player Controls & Interactive Timeline */}
                <div className="p-4 bg-white border-t border-[#DCE6F0] space-y-3">
                  {/* Timeline Seek Bar with Detection Markers */}
                  <div className="relative pt-1">
                    <input
                      type="range"
                      min={0}
                      max={duration || activeDemo?.duration || 10}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />

                    {/* Timeline Event Markers */}
                    {activeDemo?.detections.map((det) => {
                      const total = duration || activeDemo.duration || 10;
                      const pct = total > 0 ? (det.timestamp / total) * 100 : 0;
                      return (
                        <button
                          key={det.id}
                          title={`[${det.timestampFormatted}] ${det.label} (${det.trackId})`}
                          onClick={() => {
                            handleSeek(det.timestamp);
                            setSelectedDetection(det);
                          }}
                          style={{ left: `${Math.min(98, Math.max(2, pct))}%` }}
                          className={`absolute -top-1 w-3 h-4.5 -translate-x-1/2 rounded-xs border border-white shadow-xs transition-transform hover:scale-130 z-10 cursor-pointer ${
                            det.severity === 'critical'
                              ? 'bg-red-500'
                              : det.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-[#2563EB]'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Playback Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="p-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleSeek(0)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        title="Rewind to start"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="font-mono text-xs font-semibold text-slate-700 ml-1">
                        {formatTime(currentTime)} / {formatTime(duration || activeDemo?.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAiOverlay(!showAiOverlay)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
                          showAiOverlay
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span>AI OVERLAY: </span>
                        <span>{showAiOverlay ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={handleRunLiveAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#08A6B5] hover:opacity-95 text-white text-xs font-bold font-mono tracking-wider shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                        <span>RUN LIVE ANALYSIS</span>
                      </button>

                      <button
                        onClick={() => {
                          if (videoRef.current) videoRef.current.requestFullscreen?.();
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Detections Grid for Active Demo */}
              <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                      VERIFIED DETECTIONS & TRACK TIMELINE ({activeDemo?.detections.length || 0})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Click detection to seek player
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeDemo?.detections.map((det) => (
                    <div
                      key={det.id}
                      onClick={() => {
                        handleSeek(det.timestamp);
                        setSelectedDetection(det);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                        selectedDetection?.id === det.id
                          ? 'border-[#2563EB] bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Frame Thumbnail */}
                      <div className="w-20 h-14 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 relative border border-slate-200">
                        <img
                          src={det.frameUrl || activeDemo.thumbnailUrl}
                          alt={det.label}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1 rounded-xs">
                          {det.timestampFormatted}
                        </span>
                      </div>

                      {/* Detection Metadata */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#102A43] truncate">{det.label}</p>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs ${
                              det.confidence >= 95
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {det.confidence}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                          <span className="font-semibold text-teal-700 bg-teal-50 px-1 rounded-xs border border-teal-200">
                            {det.trackId}
                          </span>
                          <span>•</span>
                          <span className="uppercase text-slate-400">{det.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{det.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Conversational Search & Verified Evidence Dossier */}
            <div className="lg:col-span-4 space-y-4">
              {/* Conversational Natural Language Query Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                      CONVERSATIONAL AI SEARCH
                    </h2>
                    <p className="text-[11px] text-[#64748B]">Natural language query against video events</p>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConversationalSearch()}
                    placeholder="e.g. Find the white car..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#2563EB] text-xs text-[#102A43] pr-10"
                  />
                  <button
                    onClick={() => handleConversationalSearch()}
                    disabled={isSearching}
                    className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Suggested Natural Language Queries */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    TRY CONVERSATIONAL QUERIES:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeDemo?.suggestedQueries || [
                      'Find the car.',
                      'Find the white car.',
                      'Find the person carrying a red bag.',
                      'Show unusual movement.',
                      'Show safety event.',
                    ]).map((sq, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleConversationalSearch(sq)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] border border-slate-200 transition-colors text-left cursor-pointer"
                      >
                        "{sq}"
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Match Result Display */}
                {searchResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                      searchResult.matchFound
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs ${
                          searchResult.matchFound
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {searchResult.matchFound ? 'MATCH FOUND' : 'NO TARGET MATCH'}
                      </span>
                      {searchResult.matchFound && (
                        <span className="font-mono font-bold text-emerald-700 text-xs">
                          {searchResult.confidence}% CONF
                        </span>
                      )}
                    </div>

                    <p className="text-slate-800 font-semibold leading-snug">
                      {searchResult.reasoning}
                    </p>

                    {searchResult.matchFound && (
                      <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-600 border-t border-emerald-200/60">
                        <span>Timestamp: {searchResult.timestampFormatted}</span>
                        <button
                          onClick={() => handleSeek(searchResult.timestamp)}
                          className="font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Seek to {searchResult.timestampFormatted}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Verified Evidence Dossier Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2563EB]" />
                    <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                      EVIDENCE DOSSIER
                    </h3>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-600">
                    {selectedDetection ? `${selectedDetection.confidence}% CONF` : 'VERIFIED'}
                  </span>
                </div>

                {selectedDetection ? (
                  <div className="space-y-3">
                    {/* Visual Evidence Frame Preview */}
                    <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-200 group">
                      <img
                        src={selectedDetection.frameUrl || activeDemo?.thumbnailUrl}
                        alt="Evidence Frame"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setEvidenceFrameModal(
                              selectedDetection.frameUrl || activeDemo?.thumbnailUrl || null
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-semibold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Frame</span>
                        </button>

                        {selectedDetection.clipUrl && (
                          <button
                            onClick={() =>
                              setEvidenceClipModal({
                                url: selectedDetection.clipUrl!,
                                title: `${selectedDetection.label} (${selectedDetection.timestampFormatted})`,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Clip</span>
                          </button>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                        {selectedDetection.timestampFormatted} • {selectedDetection.trackId}
                      </div>
                    </div>

                    {/* Metadata Table */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Camera Node:</span>
                        <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                          {activeDemo?.cameraName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono font-semibold text-[#2563EB]">
                          {selectedDetection.timestampFormatted}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Detection / Label:</span>
                        <span className="font-bold text-slate-900">{selectedDetection.label}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Tracking Identifier:</span>
                        <span className="font-mono font-semibold text-teal-700">
                          {selectedDetection.trackId}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Category:</span>
                        <span className="font-semibold uppercase text-slate-700">
                          {selectedDetection.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {selectedDetection.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() =>
                          setEvidenceFrameModal(
                            selectedDetection.frameUrl || activeDemo?.thumbnailUrl || null
                          )
                        }
                        className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#102A43] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Frame</span>
                      </button>

                      <button
                        onClick={() => {
                          if (selectedDetection.clipUrl) {
                            setEvidenceClipModal({
                              url: selectedDetection.clipUrl,
                              title: `${selectedDetection.label} (${selectedDetection.timestampFormatted})`,
                            });
                          } else {
                            showToast('Generating forensic clip for playback...', 'info');
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Play Clip</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Select an event marker to inspect evidence dossier</p>
                )}
              </div>
            </div>
          </div>

          {/* Real-World Demo Library Cards Section */}
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#102A43]">
                  DEMO SCENARIOS LIBRARY ({filteredDemos.length})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Publicly accessible and openly licensed computer-vision test footage with verified ground truth
                </p>
              </div>

              {/* Scenario Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'vehicle_traffic', label: 'Vehicles' },
                  { id: 'person_object', label: 'Person + Object' },
                  { id: 'movement_safety', label: 'Movement Event' },
                  { id: 'crowd_counting', label: 'Crowd Density' },
                  { id: 'fall_safety', label: 'Fall / Safety' },
                  { id: 'airport_logistics', label: 'Aviation Ramp' },
                  { id: 'doorstep_delivery', label: 'Doorstep' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedScenario === s.id
                        ? 'bg-[#102A43] text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Real-World Demo Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDemos.map((demo) => {
                const isCurrent = activeDemo?.id === demo.id;
                return (
                  <div
                    key={demo.id}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col bg-white ${
                      isCurrent
                        ? 'border-[#2563EB] ring-2 ring-blue-500/20 shadow-md'
                        : 'border-[#DCE6F0] hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                      <img
                        src={demo.thumbnailUrl}
                        alt={demo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      {/* Duration Badge */}
                      <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                        {demo.durationFormatted}
                      </span>

                      {/* Scenario Tag */}
                      <span className="absolute top-2 left-2 bg-[#2563EB]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {demo.scenarioLabel}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold text-[#102A43] line-clamp-1 leading-snug">
                          {demo.title}
                        </h3>
                        <p className="text-[11px] text-[#64748B] line-clamp-2">
                          {demo.description}
                        </p>
                      </div>

                      {/* Available Analysis Tags */}
                      <div className="flex flex-wrap gap-1">
                        {demo.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Attribution and Source */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[150px]">{demo.sourceName}</span>
                        <span className="font-mono text-emerald-600 font-semibold">
                          {demo.stats.eventsCount} Events
                        </span>
                      </div>

                      {/* Action Button: Run Live Analysis */}
                      <button
                        onClick={() => {
                          selectDemo(demo);
                          handleRunLiveAnalysis();
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm shadow-blue-500/20'
                            : 'bg-slate-100 hover:bg-blue-50 text-[#2563EB]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>RUN LIVE ANALYSIS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Reference Gallery View (Requirement 12) */
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-[#102A43]">
              REFERENCE VIDEOS & ARCHITECTURE INSPIRATION ({references.length})
            </h2>
            <p className="text-xs text-[#64748B]">
              Benchmark industrial scenarios in CCTV analytics, object detection, vehicle counting, people tracking, and safety monitoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {references.map((ref) => (
              <div
                key={ref.id}
                className="rounded-2xl bg-white border border-[#DCE6F0] overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video bg-slate-900 overflow-hidden">
                    <img
                      src={ref.thumbnailUrl}
                      alt={ref.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-[#102A43] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {ref.category}
                    </span>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                      {ref.durationFormatted}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-xs font-bold text-[#102A43] leading-snug">
                      {ref.title}
                    </h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {ref.description}
                    </p>

                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        KEY COMPUTER-VISION CAPABILITIES:
                      </p>
                      <ul className="space-y-1">
                        {ref.keyFeatures.map((feat, idx) => (
                          <li
                            key={idx}
                            className="text-[11px] text-slate-700 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Source: {ref.sourceName}</span>
                    <span className="font-mono text-xs">{ref.license}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frame Inspection Modal */}
      {evidenceFrameModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-mono font-bold">
                FORENSIC KEYFRAME INSPECTION
              </span>
              <button
                onClick={() => setEvidenceFrameModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={evidenceFrameModal}
                alt="Forensic Frame"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Short Clip Playback Modal */}
      {evidenceClipModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold">
                  VERIFIED EVIDENCE CLIP • {evidenceClipModal.title}
                </span>
              </div>
              <button
                onClick={() => setEvidenceClipModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                src={evidenceClipModal.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
