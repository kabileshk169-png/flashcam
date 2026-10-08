export interface CameraCapabilities {
  ptz: boolean;
  audio: boolean;
  multiStream: boolean;
  zoom: boolean;
  presets?: string[];
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  group: string;
  ip?: string;
  rtspUrl?: string;
  channel?: number;
  streamPath?: string;
  transport?: 'tcp' | 'udp' | 'webrtc' | 'hls';
  sourceType: 'rtsp' | 'device' | 'webrtc' | 'hls' | 'mjpeg' | 'video_file' | 'demo' | 'embed';
  sourceUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  webcam24Url?: string;
  status: 'online' | 'offline' | 'connecting' | 'degraded' | 'auth_failed' | 'stream_error' | 'permission_denied';
  enabled: boolean;
  fps?: number;
  resolution?: string;
  bitrateKbps?: number;
  latencyMs?: number;
  lastSeen?: string;
  lastPing?: string;
  capabilities: CameraCapabilities;
  streams?: {
    high?: string;
    standard?: string;
    smooth?: string;
  };
  hasAuth?: boolean;
  username?: string;
  password?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface LiveTrack {
  trackId: string;
  label: string;
  category: 'person' | 'vehicle' | 'bag' | 'hazard' | 'object' | 'general';
  cameraId: string;
  cameraName?: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  firstSeen: number;
  lastSeen: number;
  durationSeconds: number;
  trajectory: Array<{ x: number; y: number; timestamp: number }>;
}

export interface PTZCommand {
  action: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'zoom_in' | 'zoom_out' | 'preset';
  presetName?: string;
  speed?: number;
}

export interface SnapshotRecord {
  id: string;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  user: string;
  resolution: string;
  url: string;
  fileSize: number;
}

export interface LiveRecording {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  status: 'recording' | 'completed' | 'failed';
  url?: string;
  filePath?: string;
  fileSize?: number;
}

export interface VideoRecord {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  url: string;
  fileSize: number;
  duration?: number;
  status: 'uploaded' | 'processing' | 'analyzing' | 'ready' | 'failed';
  errorMessage?: string;
  cameraId?: string;
  uploadedAt: string;
  detectionCount: number;
  detections?: Detection[];
}

export interface Detection {
  id: string;
  videoId?: string;
  cameraId?: string;
  timestamp: number;
  timestampFormatted: string;
  label: string;
  category: 'person' | 'vehicle' | 'bag' | 'hazard' | 'object' | 'general';
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  evidenceFrameUrl?: string;
  verified: boolean;
  createdAt: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface SecurityEvent {
  id: string;
  source: 'live_camera' | 'video_verification' | 'system';
  cameraId?: string;
  cameraName?: string;
  videoId?: string;
  videoTitle?: string;
  timestamp: string;
  videoTimestamp?: number;
  type: string;
  description: string;
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'unacknowledged' | 'acknowledged' | 'investigating' | 'dismissed';
  evidenceFrameUrl?: string;
  createdAt: string;
}

export interface SecurityAlert {
  id: string;
  ruleId?: string;
  ruleName?: string;
  eventId: string;
  cameraId?: string;
  cameraName?: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  status: 'active' | 'acknowledged' | 'dismissed';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  createdAt: string;
}

export interface MonitoringRule {
  id: string;
  name: string;
  targetObject: string;
  cameraId?: string;
  cameraName?: string;
  severity: 'critical' | 'warning' | 'info';
  action: 'create_alert' | 'log_event' | 'notify';
  enabled: boolean;
  triggerCount: number;
  createdAt: string;
}

export interface InvestigationNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface Investigation {
  id: string;
  title: string;
  caseNumber: string;
  status: 'open' | 'in_progress' | 'closed';
  severity: 'critical' | 'warning' | 'info';
  leadInvestigator: string;
  summary: string;
  aiSynthesis?: string;
  primaryEventId?: string;
  associatedEvents: string[];
  associatedVideoId?: string;
  notes: InvestigationNote[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  category: 'critical_alert' | 'camera_offline' | 'camera_online' | 'video_processed' | 'rule_triggered' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface UserSettings {
  userName: string;
  userEmail: string;
  role: string;
  detectionInterval: number;
  confidenceThreshold: number;
  aiModel: string;
  voiceSpeed: number;
  autoVoiceOutput: boolean;
  notificationsEnabled: boolean;
  soundAlerts: boolean;
  theme: 'dark' | 'navy';
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  confirmed: boolean;
  context?: string;
  createdAt: string;
}

export interface SystemMetrics {
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  uploadedVideos: number;
  detectedEvents: number;
  activeAlerts: number;
  systemStatus: 'optimal' | 'warning' | 'critical';
}

export type SupportedLanguage = 'EN' | 'TA' | 'HI' | 'TE' | 'KN' | 'ML';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  native: string;
  sampleQuery: string;
}

export interface ExportClipRequest {
  startTime: number;
  endTime: number;
  clipTitle?: string;
  incidentType?: string;
  severity?: 'critical' | 'warning' | 'info';
  investigatorName?: string;
  notes?: string;
  includeWatermark?: boolean;
}

export interface ExportClipResult {
  success: boolean;
  clipUrl: string;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  duration: number;
  startTime: number;
  endTime: number;
  sha256: string;
  incidentType: string;
  severity: 'critical' | 'warning' | 'info';
  investigator: string;
  timestamp: string;
  videoTitle: string;
  cameraId?: string;
}

export interface DemoDetection {
  id: string;
  timestamp: number;
  timestampFormatted: string;
  label: string;
  trackId: string;
  category: 'person' | 'vehicle' | 'bag' | 'hazard' | 'object' | 'general';
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  frameUrl: string;
  clipUrl?: string;
}

export interface DemoVideoItem {
  id: string;
  title: string;
  scenario:
    | 'vehicle_traffic'
    | 'person_object'
    | 'movement_safety'
    | 'crowd_counting'
    | 'fall_safety'
    | 'airport_logistics'
    | 'doorstep_delivery';
  scenarioLabel: string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  attribution: string;
  license: string;
  duration: number;
  durationFormatted: string;
  videoUrl: string;
  thumbnailUrl: string;
  cameraName: string;
  cameraLocation: string;
  tags: string[];
  capabilities: string[];
  suggestedQueries: string[];
  processed: boolean;
  isReferenceOnly?: boolean;
  referenceCategory?: string;
  stats: {
    peopleCount: number;
    vehicleCount: number;
    eventsCount: number;
  };
  detections: DemoDetection[];
}

export interface ReferenceVideoItem {
  id: string;
  title: string;
  category: 'CCTV Analytics' | 'Object Detection' | 'Vehicle Detection' | 'People Tracking' | 'Safety Monitoring';
  description: string;
  sourceName: string;
  sourceUrl: string;
  license: string;
  durationFormatted: string;
  thumbnailUrl: string;
  keyFeatures: string[];
}

export interface SearchMatchResult {
  query: string;
  matchFound: boolean;
  demoId: string;
  videoTitle: string;
  cameraName: string;
  timestamp: number;
  timestampFormatted: string;
  confidence: number;
  detectionLabel: string;
  trackId: string;
  category: string;
  description: string;
  evidenceFrameUrl: string;
  shortClipUrl?: string;
  reasoning: string;
  countCalculated?: number;
}

