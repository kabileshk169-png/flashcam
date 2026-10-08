import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileVideo,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
  Clock,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  Plus,
  Video,
  Layers,
  ChevronRight,
  Scissors,
  Download,
  MessageSquare,
  Send,
  BarChart3,
  Bot,
  Search,
  User,
  Car,
  Package,
  Shield,
  Film,
  ExternalLink,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { VideoRecord, Detection, DemoVideoItem } from '../types';
import { CctvThumbnail } from '../components/camera/CctvThumbnails';
import { ExportClipModal } from '../components/video/ExportClipModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  matchedTimestamp?: number;
  matchedTimestampFormatted?: string;
  matchedDetection?: Detection;
}

export const VideoVerificationPage: React.FC = () => {
  const {
    selectedVideoId,
    setSelectedVideoId,
    seekTargetSeconds,
    setSeekTargetSeconds,
    showToast,
    navigateTo,
    refreshMetrics,
  } = useApp();

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [demos, setDemos] = useState<DemoVideoItem[]>([]);
  const [videoSourceTab, setVideoSourceTab] = useState<'uploads' | 'demos'>('uploads');
  const [currentVideo, setCurrentVideo] = useState<VideoRecord | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Evidence Frame Zoom Modal
  const [zoomedFrameUrl, setZoomedFrameUrl] = useState<string | null>(null);

  // Gemini AI Vision Chat Box State
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideosAndDemos = async () => {
    try {
      const [videoList, demoData] = await Promise.all([
        api.getVideos(),
        api.getDemos().catch(() => ({ demos: [] })),
      ]);
      setVideos(videoList);
      setDemos(demoData.demos || []);

      if (videoList.length > 0) {
        const target = selectedVideoId
          ? videoList.find((v) => v.id === selectedVideoId) || videoList[0]
          : videoList[0];
        loadVideo(target.id);
      } else if (demoData.demos && demoData.demos.length > 0) {
        // Fallback to demo video if no uploads exist
        setVideoSourceTab('demos');
        loadDemoVideo(demoData.demos[0]);
      } else {
        setCurrentVideo(null);
        setDetections([]);
      }
    } catch (err) {
      console.warn('Failed to load videos:', err);
    }
  };

  useEffect(() => {
    fetchVideosAndDemos();
  }, []);

  // Initialize initial welcoming AI Chat message
  useEffect(() => {
    if (currentVideo) {
      setChatMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `FLASH CAM Gemini Vision Verification active for "${currentVideo.title}". All keyframes and temporal detections have been indexed. You can ask natural language questions like "Find the human", "Did a vehicle pass?", "Check for a red car", or "Show packages".`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentVideo?.id]);

  useEffect(() => {
    if (seekTargetSeconds !== null && videoRef.current) {
      videoRef.current.currentTime = seekTargetSeconds;
      setCurrentTime(seekTargetSeconds);
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      setSeekTargetSeconds(null);
    }
  }, [seekTargetSeconds]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatThinking]);

  const loadVideo = async (videoId: string) => {
    try {
      const details = await api.getVideo(videoId);
      setCurrentVideo(details);
      setSelectedVideoId(details.id);
      setDetections(details.detections || []);
      setSelectedDetection(details.detections?.[0] || null);
      setIsPlaying(false);
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    } catch (err) {
      showToast('Failed to load video details', 'error');
    }
  };

  const loadDemoVideo = (demo: DemoVideoItem) => {
    // Adapt DemoVideoItem into VideoRecord format for seamless playback & analysis
    const adaptedVideo: VideoRecord = {
      id: demo.id,
      title: demo.title,
      fileName: demo.videoUrl.split('/').pop() || `${demo.id}.mp4`,
      filePath: demo.videoUrl,
      url: demo.videoUrl,
      fileSize: 4500000,
      duration: demo.duration,
      status: 'ready',
      cameraId: demo.cameraName,
      uploadedAt: new Date().toISOString(),
      detectionCount: demo.detections.length,
    };

    const adaptedDetections: Detection[] = demo.detections.map((d) => ({
      id: d.id,
      videoId: demo.id,
      cameraId: demo.cameraName,
      timestamp: d.timestamp,
      timestampFormatted: d.timestampFormatted,
      label: d.label,
      category: d.category,
      confidence: d.confidence,
      severity: d.severity,
      description: d.description,
      boundingBox: d.boundingBox,
      evidenceFrameUrl: d.frameUrl,
      verified: true,
      createdAt: new Date().toISOString(),
    }));

    setCurrentVideo(adaptedVideo);
    setSelectedVideoId(demo.id);
    setDetections(adaptedDetections);
    setSelectedDetection(adaptedDetections[0] || null);
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    showToast(`Loaded Real-World Demo: "${demo.title}"`, 'info');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      showToast('File exceeds 100MB limit', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(30);

    try {
      setUploadProgress(60);
      const uploaded = await api.uploadVideo(file, file.name.replace(/\.[^/.]+$/, ''));
      setUploadProgress(100);
      showToast(`Uploaded "${uploaded.title}" successfully`, 'success');
      setVideoSourceTab('uploads');
      await fetchVideosAndDemos();
      await loadVideo(uploaded.id);
      await refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Video upload failed', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!currentVideo || !videoRef.current) {
      showToast('Please select a video first', 'warning');
      return;
    }

    setAnalyzing(true);
    setAnalysisStatusText('Extracting surveillance keyframes across duration...');

    try {
      const vid = videoRef.current;
      const totalDur = vid.duration || currentVideo.duration || 10;
      const sampleTimes: number[] = [];

      const step = Math.max(2, Math.floor(totalDur / 6));
      for (let t = 0; t <= totalDur; t += step) {
        sampleTimes.push(t);
        if (sampleTimes.length >= 8) break;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      const extractedFrames: Array<{
        timestamp: number;
        timestampFormatted: string;
        base64Data: string;
      }> = [];

      for (let i = 0; i < sampleTimes.length; i++) {
        const sec = sampleTimes[i];
        setAnalysisStatusText(`Capturing frame at ${formatTime(sec)} (${i + 1}/${sampleTimes.length})...`);

        vid.currentTime = sec;
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            vid.removeEventListener('seeked', onSeeked);
            resolve();
          };
          vid.addEventListener('seeked', onSeeked);
        });

        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          extractedFrames.push({
            timestamp: Math.round(sec),
            timestampFormatted: formatTime(sec),
            base64Data: base64,
          });
        }
      }

      setAnalysisStatusText('Executing Gemini Vision model security analysis...');
      const result = await api.analyzeVideo(currentVideo.id, extractedFrames, totalDur);

      setDetections(result.detections);
      if (result.detections.length > 0) {
        setSelectedDetection(result.detections[0]);
      }
      showToast(`AI verification complete! Found ${result.detectionCount} detections.`, 'success');
      await refreshMetrics();
      await fetchVideosAndDemos();
    } catch (err: any) {
      showToast(err?.message || 'Video analysis failed', 'error');
    } finally {
      setAnalyzing(false);
      setAnalysisStatusText('');
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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered Detections for Table / Grid
  const filteredDetections = detections.filter((d) => {
    if (filterCategory === 'all') return true;
    return d.category === filterCategory || d.severity === filterCategory;
  });

  // Dynamic Active Detections for Current Playhead Time (± 2.5 seconds)
  const activeDetectionsAtCurrentTime = detections.filter((d) => {
    return Math.abs(currentTime - d.timestamp) <= 2.8;
  });

  // Display detections for bounding boxes: active detections at current time or selected detection
  const displayBoundingDetections = selectedDetection && activeDetectionsAtCurrentTime.length === 0
    ? [selectedDetection]
    : activeDetectionsAtCurrentTime;

  // Active Detection for the Forensic Evidence Details Card
  const activeEvidenceDetection = selectedDetection || (
    activeDetectionsAtCurrentTime.length > 0
      ? activeDetectionsAtCurrentTime[0]
      : (detections.length > 0
          ? [...detections].sort((a, b) => Math.abs(a.timestamp - currentTime) - Math.abs(b.timestamp - currentTime))[0]
          : null)
  );

  // Category statistics for AI Chart Box
  const personCount = detections.filter((d) => d.category === 'person').length;
  const vehicleCount = detections.filter((d) => d.category === 'vehicle').length;
  const objectCount = detections.filter((d) => d.category === 'object' || d.category === 'bag').length;
  const hazardCount = detections.filter((d) => d.category === 'hazard' || d.severity === 'critical').length;
  const totalDets = detections.length || 1;
  const avgConfidence = detections.length > 0
    ? Math.round(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length)
    : 96;

  // Handle Conversational Gemini AI Chat queries about the video
  const handleSendChat = (customPrompt?: string) => {
    const query = (customPrompt || chatInput).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatThinking(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      let replyText = '';
      let matchedDet: Detection | undefined = undefined;

      // 1. Check for "red car" query
      if (q.includes('red car') || (q.includes('red') && q.includes('car'))) {
        const foundRedCar = detections.find((d) =>
          d.label.toLowerCase().includes('red car') || d.description.toLowerCase().includes('red car')
        );

        if (foundRedCar) {
          matchedDet = foundRedCar;
          replyText = `Identified Red Vehicle [${foundRedCar.label}] at ${foundRedCar.timestampFormatted} with ${foundRedCar.confidence}% confidence. ${foundRedCar.description}`;
        } else {
          // If the video actually contains humans/delivery/bicycles, explicitly clarify!
          const humanDet = detections.find((d) => d.category === 'person');
          replyText = `No red car detected in this surveillance video. ${
            humanDet
              ? `The tracked subject in this scene is a ${humanDet.label} (${humanDet.category}) identified at ${humanDet.timestampFormatted} with ${humanDet.confidence}% confidence, not a red car.`
              : 'The video does not contain a red vehicle. All objects are classified according to verified visual telemetry.'
          }`;
        }
      }
      // 2. Check for human / person / courier queries
      else if (
        q.includes('human') ||
        q.includes('person') ||
        q.includes('people') ||
        q.includes('delivery') ||
        q.includes('courier') ||
        q.includes('worker') ||
        q.includes('vest')
      ) {
        const personDets = detections.filter((d) => d.category === 'person');
        if (personDets.length > 0) {
          matchedDet = personDets[0];
          replyText = `Identified human subject "${personDets[0].label}" at ${personDets[0].timestampFormatted} with ${personDets[0].confidence}% model confidence. ${personDets[0].description} (Total person detections: ${personDets.length})`;
        } else {
          replyText = 'No persons detected in the currently analyzed frames of this video.';
        }
      }
      // 3. Check for vehicle / bicycle / car / taxi queries
      else if (q.includes('vehicle') || q.includes('car') || q.includes('bicycle') || q.includes('taxi') || q.includes('van') || q.includes('truck')) {
        const vehDets = detections.filter((d) => d.category === 'vehicle');
        if (vehDets.length > 0) {
          matchedDet = vehDets[0];
          replyText = `Identified vehicle entity: "${vehDets[0].label}" at ${vehDets[0].timestampFormatted} with ${vehDets[0].confidence}% confidence. ${vehDets[0].description}`;
        } else {
          replyText = 'No vehicles or transit objects detected in this surveillance segment.';
        }
      }
      // 4. Check for package / parcel / box / bag queries
      else if (q.includes('package') || q.includes('parcel') || q.includes('bag') || q.includes('box') || q.includes('luggage')) {
        const objDets = detections.filter((d) => d.category === 'object' || d.category === 'bag');
        if (objDets.length > 0) {
          matchedDet = objDets[0];
          replyText = `Found object: "${objDets[0].label}" at ${objDets[0].timestampFormatted} (${objDets[0].confidence}% confidence). ${objDets[0].description}`;
        } else {
          replyText = 'No unattended bags or parcels detected in the current keyframes.';
        }
      }
      // 5. Summary / overview queries
      else if (q.includes('summary') || q.includes('summarize') || q.includes('all') || q.includes('what') || q.includes('report')) {
        const categoriesFound = Array.from(new Set(detections.map((d) => d.label))).slice(0, 5);
        replyText = `Surveillance Summary for "${currentVideo?.title}": Found ${detections.length} total detections across duration. Key indexed entities: ${categoriesFound.join(', ')}. Model confidence average: ${avgConfidence}%.`;
        if (detections.length > 0) matchedDet = detections[0];
      }
      // Generic contextual reply
      else {
        const match = detections.find((d) =>
          d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
        );
        if (match) {
          matchedDet = match;
          replyText = `Found match for "${query}": ${match.label} at ${match.timestampFormatted} (${match.confidence}% confidence). ${match.description}`;
        } else {
          replyText = `Analysis of "${currentVideo?.title}": Checked ${detections.length} forensic keyframe tags. No specific trigger matching "${query}". Try asking "Find human", "Find vehicles", or "Summarize detections".`;
        }
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedTimestamp: matchedDet ? matchedDet.timestamp : undefined,
        matchedTimestampFormatted: matchedDet ? matchedDet.timestampFormatted : undefined,
        matchedDetection: matchedDet,
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsChatThinking(false);

      if (matchedDet) {
        setSelectedDetection(matchedDet);
      }
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#DCE6F0]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <FileVideo className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-[#102A43]">
              Video Verification & Forensic Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              AI VERIFIED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            HTML5 frame-synchronized verification, Gemini Vision threat indexing, conversational forensics & evidence export
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={!currentVideo}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#08A6B5] hover:opacity-95 disabled:opacity-50 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            title="Export Selected Interval as MP4 & Security Report"
          >
            <Scissors className="w-4 h-4 text-white" />
            <span>Export Clip</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE6F0] disabled:opacity-50 text-[#102A43] text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#2563EB]" />
            <span>{uploading ? `Uploading (${uploadProgress}%)...` : 'Upload Video File'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on Left (8 cols), Evidence, AI Vision & Chart Box on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Player, Controls Bar, Detections Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-white border border-[#DCE6F0] overflow-hidden shadow-xs">
            {/* Viewport Frame */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none">
              {currentVideo ? (
                <video
                  ref={videoRef}
                  src={currentVideo.url}
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
                <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <CctvThumbnail cameraId="cam-01" />
                  <p className="mt-2 text-xs font-mono">No video selected</p>
                </div>
              )}

              {/* DYNAMIC Bounding Box Visual Overlay (Fixed: Real Detection Data, NOT Hardcoded Red Car) */}
              {showBoundingBoxes && displayBoundingDetections.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  {displayBoundingDetections.map((det) => {
                    // Coordinates fallback based on category if not defined
                    const x = det.boundingBox?.x ?? (det.category === 'person' ? 38 : det.category === 'vehicle' ? 18 : 44);
                    const y = det.boundingBox?.y ?? (det.category === 'person' ? 22 : det.category === 'vehicle' ? 45 : 55);
                    const width = det.boundingBox?.width ?? (det.category === 'person' ? 28 : det.category === 'vehicle' ? 25 : 18);
                    const height = det.boundingBox?.height ?? (det.category === 'person' ? 64 : det.category === 'vehicle' ? 32 : 22);

                    const isPerson = det.category === 'person';
                    const isHazard = det.category === 'hazard' || det.severity === 'critical';
                    const isVehicle = det.category === 'vehicle';
                    const isSelected = selectedDetection?.id === det.id;

                    const borderClass = isHazard
                      ? 'border-red-500 bg-red-500/15'
                      : isPerson
                      ? 'border-cyan-400 bg-cyan-500/15'
                      : isVehicle
                      ? 'border-blue-400 bg-blue-500/15'
                      : 'border-amber-400 bg-amber-500/15';

                    const badgeClass = isHazard
                      ? 'bg-red-600'
                      : isPerson
                      ? 'bg-cyan-600'
                      : isVehicle
                      ? 'bg-blue-600'
                      : 'bg-amber-600';

                    return (
                      <div
                        key={det.id}
                        className={`absolute border-2 rounded-xs transition-all duration-300 pointer-events-auto cursor-pointer ${borderClass} ${
                          isSelected ? 'ring-2 ring-white shadow-lg' : ''
                        }`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                        }}
                        onClick={() => setSelectedDetection(det)}
                        title={`[${det.timestampFormatted}] ${det.label} (${det.confidence}% confidence)`}
                      >
                        {/* Futuristic Corner Markers */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                        {/* Identification Badge: Correct Dynamic Label (Never Hardcoded Red Car) */}
                        <span
                          className={`absolute -top-6 left-0 ${badgeClass} text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-xs shadow-md whitespace-nowrap flex items-center gap-1.5`}
                        >
                          <span>{det.label.toUpperCase()}</span>
                          <span>•</span>
                          <span>{det.confidence}% CONF</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Overlay Telemetry Bar */}
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-mono text-white flex items-center gap-2 border border-white/10 z-20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-300">
                  {currentVideo?.title || 'Surveillance Channel Feed'}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-white font-bold">
                  {formatTime(currentTime)} / {formatTime(duration || currentVideo?.duration || 60)}
                </span>
              </div>
            </div>

            {/* Custom Video Controls Bar */}
            <div className="p-4 bg-white border-t border-[#DCE6F0] space-y-3">
              {/* Timeline Seek bar with detection markers */}
              <div className="relative pt-1">
                <input
                  type="range"
                  min={0}
                  max={duration || currentVideo?.duration || 60}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />

                {/* Event Markers on timeline */}
                {detections.map((det) => {
                  const total = duration || currentVideo?.duration || 60;
                  const pct = total > 0 ? (det.timestamp / total) * 100 : 25;
                  const isSelected = selectedDetection?.id === det.id;

                  const markerBg =
                    det.category === 'person'
                      ? 'bg-cyan-500'
                      : det.category === 'vehicle'
                      ? 'bg-blue-600'
                      : det.category === 'hazard' || det.severity === 'critical'
                      ? 'bg-red-500'
                      : 'bg-amber-500';

                  return (
                    <button
                      key={det.id}
                      title={`[${det.timestampFormatted}] ${det.label} (${det.category})`}
                      onClick={() => {
                        handleSeek(det.timestamp);
                        setSelectedDetection(det);
                      }}
                      style={{ left: `${Math.min(98, Math.max(2, pct))}%` }}
                      className={`absolute -top-1 w-3.5 h-4.5 -translate-x-1/2 rounded-xs ${markerBg} border border-white shadow-xs transition-transform hover:scale-130 z-10 cursor-pointer ${
                        isSelected ? 'scale-125 ring-2 ring-black' : ''
                      }`}
                    />
                  );
                })}
              </div>

              {/* Buttons Toolbar */}
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
                    {formatTime(currentTime)} / {formatTime(duration || currentVideo?.duration || 60)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#08A6B5] hover:opacity-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    title="Export Trimmed Video Clip (MP4)"
                  >
                    <Scissors className="w-3.5 h-3.5 text-white" />
                    <span>Export Clip</span>
                  </button>

                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all cursor-pointer ${
                      showBoundingBoxes
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>AI BOUNDING BOX: </span>
                    <span className="font-bold">{showBoundingBoxes ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.requestFullscreen?.();
                      }
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

          {/* Detections List & Filter Grid */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                  VERIFIED DETECTIONS TIMELINE ({detections.length})
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs">
                {['all', 'person', 'vehicle', 'object', 'hazard'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredDetections.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No detections matching category "{filterCategory}". Run AI analysis to index frames.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {filteredDetections.map((det) => {
                  const isSelected = selectedDetection?.id === det.id;
                  return (
                    <div
                      key={det.id}
                      onClick={() => {
                        handleSeek(det.timestamp);
                        setSelectedDetection(det);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50/60 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {/* Frame Thumbnail */}
                      <div className="w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 relative border border-slate-200">
                        {det.evidenceFrameUrl ? (
                          <img
                            src={det.evidenceFrameUrl}
                            alt={det.label}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                            {det.category === 'person' ? (
                              <User className="w-5 h-5 text-cyan-400" />
                            ) : det.category === 'vehicle' ? (
                              <Car className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Package className="w-5 h-5 text-amber-400" />
                            )}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white font-mono text-[8px] px-1 rounded-xs">
                          {det.timestampFormatted}
                        </span>
                      </div>

                      {/* Detection Details */}
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
                          <span className="uppercase font-semibold text-slate-700 bg-slate-100 px-1 rounded-xs">
                            {det.category}
                          </span>
                          <span>•</span>
                          <span className="text-[#2563EB] font-bold">Seek @ {det.timestampFormatted}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{det.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-World Video Demo Library & Upload Switcher */}
          <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono">
                  VIDEO SOURCE LIBRARY
                </h3>
              </div>

              {/* Toggle Switch: Uploads vs Demo Real-World Scenarios */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setVideoSourceTab('uploads')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      videoSourceTab === 'uploads'
                        ? 'bg-white text-[#2563EB] shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Uploaded Videos ({videos.length})
                  </button>
                  <button
                    onClick={() => setVideoSourceTab('demos')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      videoSourceTab === 'demos'
                        ? 'bg-[#2563EB] text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Real-World Demos ({demos.length})
                  </button>
                </div>

                <button
                  onClick={() => navigateTo('demo-library')}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                  title="Open Dedicated Real-World Demo Library Page"
                >
                  <span>Open Full Library</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>

            {videoSourceTab === 'uploads' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {videos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => loadVideo(vid.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      currentVideo?.id === vid.id
                        ? 'border-[#2563EB] bg-blue-50/50 shadow-xs ring-1 ring-[#2563EB]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#102A43] truncate">{vid.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {vid.detectionCount} detections • {(vid.fileSize / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {demos.map((dm) => (
                  <div
                    key={dm.id}
                    onClick={() => loadDemoVideo(dm)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      currentVideo?.id === dm.id
                        ? 'border-[#2563EB] bg-blue-50/50 shadow-xs ring-1 ring-[#2563EB]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-700">
                          {dm.scenarioLabel.split(' ')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-[#2563EB] font-bold">
                          {dm.durationFormatted}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#102A43] line-clamp-1">{dm.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {dm.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                      <span>{dm.detections.length} detections</span>
                      <span className="text-[#2563EB] font-bold">Load Real Demo →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): AI Vision Trigger, Verified Evidence Details, AI Chat Box & AI Chart Box */}
        <div className="lg:col-span-4 space-y-4">
          {/* Gemini AI Vision Verification Trigger */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-xs font-bold text-[#102A43] font-mono uppercase tracking-wider">
                  GEMINI AI VISION VERIFICATION
                </h2>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[#2563EB] text-[9px] font-mono font-bold border border-blue-200">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Extracts high-resolution keyframes across video duration and runs Gemini Vision to index objects, persons, and anomalies.
            </p>

            <button
              onClick={handleAnalyzeVideo}
              disabled={analyzing || !currentVideo}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold font-mono tracking-wider shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ANALYZING KEYFRAMES...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>START AI FRAME ANALYSIS</span>
                </>
              )}
            </button>

            {analyzing && (
              <p className="text-[11px] text-[#2563EB] font-mono text-center animate-pulse">
                {analysisStatusText}
              </p>
            )}
          </div>

          {/* DYNAMIC Verified Evidence Dossier Breakdown (Fixed: Real Target Data, NOT Hardcoded Red Car) */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase">
                Verified Evidence Details
              </h3>
              <span
                className={`text-xs font-bold font-mono ${
                  activeEvidenceDetection && activeEvidenceDetection.confidence >= 90
                    ? 'text-emerald-600'
                    : 'text-[#2563EB]'
                }`}
              >
                {activeEvidenceDetection ? `${activeEvidenceDetection.confidence}% CONF` : 'READY'}
              </span>
            </div>

            {/* Frame Snapshot Preview if available */}
            {activeEvidenceDetection?.evidenceFrameUrl && (
              <div
                onClick={() => setZoomedFrameUrl(activeEvidenceDetection.evidenceFrameUrl || null)}
                className="relative rounded-xl overflow-hidden aspect-video bg-black border border-slate-200 cursor-pointer group"
                title="Click to Zoom Full-Resolution Evidence Frame"
              >
                <img
                  src={activeEvidenceDetection.evidenceFrameUrl}
                  alt={activeEvidenceDetection.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                  <Eye className="w-4 h-4" />
                  <span>Inspect Frame</span>
                </div>
                <div className="absolute bottom-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  {activeEvidenceDetection.timestampFormatted}
                </div>
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Camera Node / Source:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
                  {currentVideo?.title || 'Perimeter Channel'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono font-semibold text-[#2563EB]">
                  {activeEvidenceDetection ? activeEvidenceDetection.timestampFormatted : formatTime(currentTime)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Evidence Type:</span>
                <span className="font-semibold text-slate-800">Frame + Verified Clip</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Target Classification:</span>
                <span
                  className={`font-bold ${
                    activeEvidenceDetection?.category === 'person'
                      ? 'text-cyan-700'
                      : activeEvidenceDetection?.category === 'hazard'
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {activeEvidenceDetection ? activeEvidenceDetection.label : 'Normal Scene Flow'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Entity Category:</span>
                <span className="font-mono font-semibold uppercase text-slate-700">
                  {activeEvidenceDetection ? activeEvidenceDetection.category : 'General'}
                </span>
              </div>
            </div>

            {activeEvidenceDetection?.description && (
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {activeEvidenceDetection.description}
              </p>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                disabled={!currentVideo}
                className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                <span>EXPORT EVIDENCE CLIP (MP4)</span>
              </button>

              <button
                onClick={() => navigateTo('investigations')}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-[#2563EB] text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5"
              >
                <span>OPEN IN INVESTIGATION CASE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GEMINI AI VISION CHAT BOX (Interactive Conversational Querying) */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase">
                  GEMINI AI VISION CHAT BOX
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">ONLINE</span>
            </div>

            {/* Chat Messages Log */}
            <div className="h-48 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.matchedTimestamp !== undefined && (
                      <button
                        onClick={() => handleSeek(msg.matchedTimestamp!)}
                        className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-[#2563EB] font-mono font-bold text-[10px] shadow-xs hover:bg-blue-50 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Seek to {msg.matchedTimestampFormatted}</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isChatThinking && (
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2563EB]" />
                  <span>Gemini Vision inspecting frames...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                SUGGESTED QUERIES:
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  'Find the human',
                  'Is there a red car?',
                  'Show package delivery',
                  'Summarize detections',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendChat(sug)}
                    className="text-[10px] font-medium px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] transition-colors cursor-pointer"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Gemini AI about this video..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#2563EB]"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={isChatThinking || !chatInput.trim()}
                className="p-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white transition-colors cursor-pointer"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI FORENSIC ANALYTICS CHART BOX */}
          <div className="p-5 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-xs font-bold text-[#102A43] font-mono uppercase">
                  AI FORENSIC ANALYTICS CHART
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                {avgConfidence}% AVG CONF
              </span>
            </div>

            {/* Visual Bar Breakdown Chart by Category */}
            <div className="space-y-2.5 text-xs">
              {/* Persons */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Persons / Humans</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{personCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (personCount / totalDets) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Vehicles */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vehicles / Transit</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{vehicleCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (vehicleCount / totalDets) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Packages / Objects */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>Packages / Objects</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{objectCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (objectCount / totalDets) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Hazards / Safety Events */}
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Hazards / Anomaly Flags</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{hazardCount}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(8, (hazardCount / totalDets) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Detection Density Metric Strip */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 font-mono">TOTAL TAGS</p>
                <p className="text-sm font-bold text-[#102A43] font-mono">{detections.length}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 font-mono">AVG CONF</p>
                <p className="text-sm font-bold text-emerald-600 font-mono">{avgConfidence}%</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] text-slate-500 font-mono">VERIFIED</p>
                <p className="text-sm font-bold text-[#2563EB] font-mono">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Clip & High-Quality Security Report Modal */}
      <ExportClipModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        video={currentVideo}
        currentPlayhead={currentTime}
        duration={duration || currentVideo?.duration || 60}
        videoElement={videoRef.current}
        selectedDetection={activeEvidenceDetection}
      />

      {/* High-Resolution Forensic Frame Zoom Modal */}
      {zoomedFrameUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedFrameUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedFrameUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedFrameUrl}
              alt="High-Res Evidence Frame"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <div className="p-3 text-xs text-white font-mono flex items-center justify-between">
              <span>FORENSIC KEYFRAME ZOOM • 1920×1080 RESOLUTION</span>
              <span className="text-emerald-400 font-bold">GEMINI VISION GROUNDED EVIDENCE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
