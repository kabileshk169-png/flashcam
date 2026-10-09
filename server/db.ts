import fs from 'fs';
import path from 'path';

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
  duration?: number; // in seconds
  status: 'uploaded' | 'processing' | 'analyzing' | 'ready' | 'failed';
  errorMessage?: string;
  cameraId?: string;
  uploadedAt: string;
  detectionCount: number;
}

export interface Detection {
  id: string;
  videoId?: string;
  cameraId?: string;
  timestamp: number; // in seconds from video start or unix timestamp
  timestampFormatted: string; // e.g. "00:04"
  label: string; // e.g. "Red Bag", "Suspicious Individual", "Vehicle"
  category: 'person' | 'vehicle' | 'bag' | 'hazard' | 'object' | 'general';
  confidence: number; // 0 to 100
  severity: 'critical' | 'warning' | 'info';
  description: string;
  evidenceFrameUrl?: string; // base64 or stored frame path
  boundingBox?: { x: number; y: number; width: number; height: number };
  verified: boolean;
  createdAt: string;
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
  targetObject: string; // e.g. "red bag", "unauthorized person", "vehicle"
  cameraId?: string; // all cameras if undefined or "all"
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
  associatedEvents: string[]; // event IDs
  associatedVideoId?: string;
  notes: InvestigationNote[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  key: string; // e.g. "Main Gate alias"
  value: string; // e.g. "Camera 01"
  confirmed: boolean;
  context?: string;
  createdAt: string;
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
  detectionInterval: number; // in seconds, e.g. 2
  confidenceThreshold: number; // e.g. 60
  aiModel: string;
  voiceSpeed: number; // e.g. 1.0
  autoVoiceOutput: boolean;
  notificationsEnabled: boolean;
  soundAlerts: boolean;
  theme: 'dark' | 'navy';
}

export interface DatabaseSchema {
  cameras: Camera[];
  videos: VideoRecord[];
  detections: Detection[];
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  rules: MonitoringRule[];
  investigations: Investigation[];
  memory: MemoryEntry[];
  notifications: NotificationItem[];
  settings: UserSettings;
  snapshots: SnapshotRecord[];
  recordings: LiveRecording[];
  tracks: LiveTrack[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? '/tmp' : path.resolve(process.cwd(), 'data');
const READ_DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');
const WRITE_DB_FILE = isServerless ? path.join('/tmp', 'db.json') : READ_DB_FILE;

const DEFAULT_SETTINGS: UserSettings = {
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
};

const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'cam-01',
    name: 'Sturgis Motorcycle Rally Cam',
    location: 'Main St, Sturgis, South Dakota, USA',
    group: 'Public Square / Events',
    ip: '192.168.1.101',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/sturgis',
    channel: 1,
    streamPath: '/live/cam-01',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/sturgis-motorcycle-rally/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/uu82CI54eJU?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/sturgis-motorcycle-rally-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 45,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Harley Rally Point', 'Main Street West', 'Civic Crossing'],
    },
    streams: {
      high: '1080p @ 30 FPS (4 Mbps)',
      standard: '720p @ 25 FPS (2 Mbps)',
      smooth: '480p @ 15 FPS (800 Kbps)',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-02',
    name: 'Las Vegas Bridge Street Cam',
    location: 'Bridge St, Las Vegas, New Mexico, USA',
    group: 'Traffic / Downtown',
    ip: '192.168.1.102',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/lasvegas',
    channel: 2,
    streamPath: '/live/cam-02',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/lasvegas-bridge-street-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/sw8MuxrKcs8?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/lasvegas-bridge-street-cam-webcamtaxi/thumbnail/968x545/usa-new-mexico-las-vegas.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 52,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Bridge St Plaza', 'Historic District', 'West Intersection'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-03',
    name: 'Bandai Bridge Niigata Cam',
    location: 'Shinano River, Niigata, Japan',
    group: 'Infrastructure / Bridge',
    ip: '192.168.1.103',
    rtspUrl: 'rtsp://live.webcamera24.com:554/japan/bandai',
    channel: 3,
    streamPath: '/live/cam-03',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/japan/bandai-bridge-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/s_jLXm299n4?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/bandai-bridge-cam-webcamtaxi/thumbnail/968x545/japan-niigata-bandai-bridge.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 88,
    capabilities: {
      ptz: true,
      audio: false,
      multiStream: true,
      zoom: true,
      presets: ['Shinano Riverbank', 'Bandai Arch Span', 'Niigata City Line'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-04',
    name: 'Nantucket Lower Main Street Cam',
    location: 'Cobblestone Historic Area, Nantucket, MA, USA',
    group: 'Commercial / Historic',
    ip: '192.168.1.104',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/nantucket',
    channel: 4,
    streamPath: '/live/cam-04',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/nantucket-lower-main-street-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/sp-FHZY95QM?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/nantucket-lower-main-street-cam-webcamtaxi/thumbnail/968x545/england-devon-exmouth-marina.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 3500,
    latencyMs: 42,
    capabilities: {
      ptz: false,
      audio: true,
      multiStream: true,
      zoom: true,
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-05',
    name: 'Philadelphia Triangle Square Cam',
    location: 'Kensington Triangle, Philadelphia, PA, USA',
    group: 'Urban / Junction',
    ip: '192.168.1.105',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/philly',
    channel: 5,
    streamPath: '/live/cam-05',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/philadelphia-triangle-square-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jAZjvlaBW3Y?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/philadelphia-triangle-square-cam-webcamtaxi/thumbnail/968x545/usa-kensington-philadelphia-triangle-square.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 35,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Triangle Square', 'Frankford Ave Transit', 'Pedestrian Walkway'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-06',
    name: 'Auto Service Vilgud Klin Workshop Cam',
    location: 'Volokolamskoe Hwy 22, Klin, Moscow Oblast, Russia',
    group: 'Logistics / Workshop',
    ip: '192.168.1.106',
    rtspUrl: 'rtsp://live.webcamera24.com:554/russia/klin',
    channel: 6,
    streamPath: '/live/cam-06',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/russia/4464-klin-ceh/',
    embedUrl: 'https://open.ivideon.com/embed/v2/?server=100-3c8e1f6d6762afad5bd69c63dfeff2a8&camera=0&width=&height=&lang=en',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/4464-klin-ceh-uastreaming/thumbnail/968x545/4464_1692113736_rzkxizhhlxfihwisawnlpapojteaxifdomyrsexv.webp',
    status: 'online',
    enabled: true,
    fps: 25,
    resolution: '1280x720',
    bitrateKbps: 2048,
    latencyMs: 110,
    capabilities: {
      ptz: false,
      audio: false,
      multiStream: true,
      zoom: true,
    },
    streams: {
      high: '720p @ 25 FPS',
      standard: '480p @ 20 FPS',
      smooth: '360p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-07',
    name: 'Muscatine Merrill Hotel Railcam',
    location: 'Mississippi Riverfront, Muscatine, Iowa, USA',
    group: 'Rail / Transit',
    ip: '192.168.1.107',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/muscatine',
    channel: 7,
    streamPath: '/live/cam-07',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/muscatine-merrill-hotel-railcam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jld8d8xgMbc?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/muscatine-merrill-hotel-railcam-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 48,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['CPKC Mainline Track', 'Mississippi River View', 'Harbor Marina'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-08',
    name: 'Ritz Madeira Avenida Arriaga Cam',
    location: 'Avenida Arriaga, Funchal, Madeira, Portugal',
    group: 'Promenade / European Plaza',
    ip: '192.168.1.108',
    rtspUrl: 'rtsp://live.webcamera24.com:554/portugal/ritz',
    channel: 8,
    streamPath: '/live/cam-08',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/portugal/ritz-livecam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/afyrMxe0qjg?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/ritz-livecam-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 76,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Avenida Promenade', 'Municipal Garden', 'Cafe Patio'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-09',
    name: 'Fort Lauderdale Beach Bar Cam',
    location: 'Beach Blvd, Fort Lauderdale, Florida, USA',
    group: 'Hospitality / Interior',
    ip: '192.168.1.109',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/ftlauderdale',
    channel: 9,
    streamPath: '/live/cam-09',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/fort-lauderdale-beach-bar-interior/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/wVNt3l657X0?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/fort-lauderdale-beach-bar-interior-youtube/thumbnail/968x545/fort-lauderdale-beach-bar-interior.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 3800,
    latencyMs: 55,
    capabilities: {
      ptz: false,
      audio: true,
      multiStream: true,
      zoom: true,
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-10',
    name: 'Sydney Harbour Panoramic Cam',
    location: 'Sydney Harbour, New South Wales, Australia',
    group: 'Maritime / Port',
    ip: '192.168.1.110',
    rtspUrl: 'rtsp://live.webcamera24.com:554/australia/sydney',
    channel: 10,
    streamPath: '/live/cam-10',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/australia/sydney-harbour-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/5uZa3-RMFos?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/sydney-harbour-cam-webcamtaxi/thumbnail/968x545/australia-new-south-wales-sydney-harbour.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 125,
    capabilities: {
      ptz: true,
      audio: false,
      multiStream: true,
      zoom: true,
      presets: ['Sydney Opera House', 'Harbour Bridge', 'Ferry Terminal'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-11',
    name: 'Shantikunj Gayatri Pariwar Haridwar Cam',
    location: 'Ganga Riverbank, Haridwar, Uttarakhand, India',
    group: 'Cultural / Campus',
    ip: '192.168.1.111',
    rtspUrl: 'rtsp://live.webcamera24.com:554/india/haridwar',
    channel: 11,
    streamPath: '/live/cam-11',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/india/shantikunj-gayatri-pariwar-haridwar/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/Bi9cRN61nOY?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/shantikunj-gayatri-pariwar-haridwar-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 3500,
    latencyMs: 22,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Yagya Shala', 'Pragyeshwar Mahakal', 'Campus Gateway'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-12',
    name: 'Elbo Room Bar Beachfront Cam',
    location: 'Las Olas Blvd, Fort Lauderdale, Florida, USA',
    group: 'Commercial / Coastal',
    ip: '192.168.1.112',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/elboroom',
    channel: 12,
    streamPath: '/live/cam-12',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/elboroom-bar-band-cam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/YWs0HMRVCBY?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/elboroom-bar-band-cam-webcamtaxi/thumbnail/968x545/usa-florida-elbo-room-bar.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 45,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Stage View', 'Las Olas Intersection', 'Atlantic Oceanfront'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-13',
    name: 'Avenida Brasil Balneário Camboriú Cam',
    location: 'Avenida Brasil, Balneário Camboriú, Santa Catarina, Brazil',
    group: 'Traffic / Coastal Boulevard',
    ip: '192.168.1.113',
    rtspUrl: 'rtsp://live.webcamera24.com:554/brazil/avenidabrasil',
    channel: 13,
    streamPath: '/live/cam-13',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/brazil/avenida-brasil-livecam/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/ZMcmtGYYg5E?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/avenida-brasil-livecam-webcamtaxi/thumbnail/968x545/brazil-santa-catarina-avenida-brasil.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 92,
    capabilities: {
      ptz: true,
      audio: false,
      multiStream: true,
      zoom: true,
      presets: ['Avenida Brasil South', 'Praia Central View', 'City Center'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-14',
    name: 'Times Square Midtown Sky Cam',
    location: 'Times Square & Midtown, New York City, NY, USA',
    group: 'High Density Urban',
    ip: '192.168.1.114',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/timessquare',
    channel: 14,
    streamPath: '/live/cam-14',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/times-square-ball/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/VGnFLdQW39A?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/times-square-ball-webcamtaxi/thumbnail/968x545/usa-new-york-times-square-ball.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4500,
    latencyMs: 30,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['Broadway Plaza', 'Duffy Square', '42nd Street Crossing'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-15',
    name: 'Church Street Marketplace Cam',
    location: 'Church St Mall, Burlington, Vermont, USA',
    group: 'Pedestrian Mall / Commercial',
    ip: '192.168.1.115',
    rtspUrl: 'rtsp://live.webcamera24.com:554/usa/burlington',
    channel: 15,
    streamPath: '/live/cam-15',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/usa/church-street-burlington/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/zl1woMXGGmQ?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/church-street-burlington-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 3800,
    latencyMs: 38,
    capabilities: {
      ptz: true,
      audio: true,
      multiStream: true,
      zoom: true,
      presets: ['City Hall Park', 'Main Pedestrian Strip', 'Bank Street Corner'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cam-16',
    name: 'Castelldefels Beach Coastline Cam',
    location: 'Passeig Marítim, Castelldefels, Barcelona, Spain',
    group: 'Perimeter / Coastal',
    ip: '192.168.1.116',
    rtspUrl: 'rtsp://live.webcamera24.com:554/spain/castelldefels',
    channel: 16,
    streamPath: '/live/cam-16',
    transport: 'tcp',
    sourceType: 'embed',
    sourceUrl: 'https://webcamera24.com/camera/spain/castelldefels-beach/',
    embedUrl: 'https://www.youtube-nocookie.com/embed/oe5GPi_C7Go?autoplay=1&mute=1&enablejsapi=1',
    thumbnailUrl: 'https://cdn.webcamera24.com/static/image/camera/detail/castelldefels-beach-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
    status: 'online',
    enabled: true,
    fps: 30,
    resolution: '1920x1080',
    bitrateKbps: 4096,
    latencyMs: 70,
    capabilities: {
      ptz: true,
      audio: false,
      multiStream: true,
      zoom: true,
      presets: ['Promenade Walkway', 'Beachfront Line', 'Marina Horizon'],
    },
    streams: {
      high: '1080p @ 30 FPS',
      standard: '720p @ 25 FPS',
      smooth: '480p @ 15 FPS',
    },
    hasAuth: false,
    isDemo: false,
    lastPing: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_RULES: MonitoringRule[] = [
  {
    id: 'rule-01',
    name: 'Perimeter Security & Ingress Monitor',
    targetObject: 'perimeter breach',
    cameraId: 'all',
    severity: 'warning',
    action: 'log_event',
    enabled: true,
    triggerCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-02',
    name: 'Perimeter Unauthorized Person Detection',
    targetObject: 'person',
    cameraId: 'cam-01',
    cameraName: 'Main Gate (Cam 01)',
    severity: 'warning',
    action: 'create_alert',
    enabled: true,
    triggerCount: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rule-03',
    name: 'Vehicle Entry After Hours',
    targetObject: 'vehicle',
    cameraId: 'all',
    severity: 'info',
    action: 'log_event',
    enabled: true,
    triggerCount: 0,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_MEMORY: MemoryEntry[] = [
  {
    id: 'mem-01',
    key: 'Main Gate',
    value: 'cam-01',
    confirmed: true,
    context: 'Main perimeter checkpoint resolved to Camera 01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mem-02',
    key: 'Loading Dock',
    value: 'cam-02',
    confirmed: true,
    context: 'Logistics bay resolved to Camera 02',
    createdAt: new Date().toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  private secrets: Map<string, { username?: string; password?: string; rawRtspUrl?: string }> = new Map();

  constructor() {
    this.data = this.loadData();
  }

  private ensureDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // Safe fallback in read-only serverless environments
    }
  }

  private sanitizeCamera(cam: Camera): Camera {
    const copy = { ...cam };
    // Strip user:pass from rtspUrl if embedded
    if (copy.rtspUrl) {
      try {
        const url = new URL(copy.rtspUrl);
        if (url.username || url.password) {
          copy.hasAuth = true;
          url.username = '';
          url.password = '';
          copy.rtspUrl = url.toString();
        }
      } catch {
        // Regex fallback
        if (copy.rtspUrl.includes('@')) {
          copy.hasAuth = true;
          copy.rtspUrl = copy.rtspUrl.replace(/\/\/[^@]+@/, '//');
        }
      }
    }
    const sec = this.secrets.get(cam.id);
    if (sec && (sec.username || sec.password)) {
      copy.hasAuth = true;
    }
    return copy;
  }

  private loadData(): DatabaseSchema {
    this.ensureDir();
    const candidateFile = fs.existsSync(WRITE_DB_FILE)
      ? WRITE_DB_FILE
      : fs.existsSync(READ_DB_FILE)
      ? READ_DB_FILE
      : null;

    if (candidateFile) {
      try {
        const raw = fs.readFileSync(candidateFile, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          cameras: (parsed.cameras && parsed.cameras.length > 0) ? parsed.cameras : INITIAL_CAMERAS,
          videos: parsed.videos || [],
          detections: parsed.detections || [],
          events: parsed.events || [],
          alerts: parsed.alerts || [],
          rules: parsed.rules || INITIAL_RULES,
          investigations: parsed.investigations || [],
          memory: parsed.memory || INITIAL_MEMORY,
          notifications: parsed.notifications || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          snapshots: parsed.snapshots || [],
          recordings: parsed.recordings || [],
          tracks: parsed.tracks || [],
        };
      } catch (err) {
        console.error('Error reading db.json, initializing fresh store:', err);
      }
    }

    const fresh: DatabaseSchema = {
      cameras: INITIAL_CAMERAS,
      videos: [],
      detections: [],
      events: [],
      alerts: [],
      rules: INITIAL_RULES,
      investigations: [],
      memory: INITIAL_MEMORY,
      notifications: [
        {
          id: 'notif-01',
          category: 'system',
          title: 'FLASH CAM System Initialized',
          message: 'All surveillance pipelines active. AI vision model connected.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      settings: DEFAULT_SETTINGS,
      snapshots: [],
      recordings: [],
      tracks: [],
    };
    this.persist(fresh);
    return fresh;
  }

  private persist(data: DatabaseSchema) {
    try {
      this.ensureDir();
      fs.writeFileSync(WRITE_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[FLASH CAM DB] Storage write warning (in-memory state preserved):', err);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public save() {
    this.persist(this.data);
  }

  // Camera methods (Always sanitized for client protection)
  public getCameras(): Camera[] {
    return this.data.cameras.map((c) => this.sanitizeCamera(c));
  }

  public getRawCameras(): Camera[] {
    return this.data.cameras;
  }

  public getCameraById(id: string): Camera | undefined {
    const cam = this.data.cameras.find((c) => c.id === id);
    return cam ? this.sanitizeCamera(cam) : undefined;
  }

  public getRawCameraById(id: string): Camera | undefined {
    return this.data.cameras.find((c) => c.id === id);
  }

  public setCameraSecrets(
    id: string,
    secrets: { username?: string; password?: string; rawRtspUrl?: string }
  ) {
    this.secrets.set(id, secrets);
  }

  public getCameraSecrets(id: string) {
    return this.secrets.get(id);
  }

  public addCamera(camera: Camera, secrets?: { username?: string; password?: string; rawRtspUrl?: string }): Camera {
    this.data.cameras.push(camera);
    if (secrets) {
      this.secrets.set(camera.id, secrets);
    }
    this.save();
    return this.sanitizeCamera(camera);
  }

  public updateCamera(id: string, updates: Partial<Camera>): Camera | undefined {
    const idx = this.data.cameras.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.cameras[idx] = { ...this.data.cameras[idx], ...updates };
    this.save();
    return this.sanitizeCamera(this.data.cameras[idx]);
  }

  public deleteCamera(id: string): boolean {
    const initLen = this.data.cameras.length;
    this.data.cameras = this.data.cameras.filter((c) => c.id !== id);
    this.secrets.delete(id);
    if (this.data.cameras.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Snapshots
  public getSnapshots(cameraId?: string): SnapshotRecord[] {
    if (!this.data.snapshots) this.data.snapshots = [];
    if (cameraId && cameraId !== 'all') {
      return this.data.snapshots.filter((s) => s.cameraId === cameraId);
    }
    return this.data.snapshots;
  }

  public addSnapshot(snapshot: SnapshotRecord): SnapshotRecord {
    if (!this.data.snapshots) this.data.snapshots = [];
    this.data.snapshots.unshift(snapshot);
    this.save();
    return snapshot;
  }

  // Recordings
  public getRecordings(cameraId?: string): LiveRecording[] {
    if (!this.data.recordings) this.data.recordings = [];
    if (cameraId && cameraId !== 'all') {
      return this.data.recordings.filter((r) => r.cameraId === cameraId);
    }
    return this.data.recordings;
  }

  public addRecording(recording: LiveRecording): LiveRecording {
    if (!this.data.recordings) this.data.recordings = [];
    this.data.recordings.unshift(recording);
    this.save();
    return recording;
  }

  public updateRecording(id: string, updates: Partial<LiveRecording>): LiveRecording | undefined {
    if (!this.data.recordings) this.data.recordings = [];
    const idx = this.data.recordings.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.data.recordings[idx] = { ...this.data.recordings[idx], ...updates };
    this.save();
    return this.data.recordings[idx];
  }

  // Live Object Tracks
  public getTracks(cameraId?: string): LiveTrack[] {
    if (!this.data.tracks) this.data.tracks = [];
    if (cameraId && cameraId !== 'all') {
      return this.data.tracks.filter((t) => t.cameraId === cameraId);
    }
    return this.data.tracks;
  }

  public updateTrack(track: LiveTrack): LiveTrack {
    if (!this.data.tracks) this.data.tracks = [];
    const idx = this.data.tracks.findIndex((t) => t.trackId === track.trackId && t.cameraId === track.cameraId);
    if (idx >= 0) {
      this.data.tracks[idx] = track;
    } else {
      this.data.tracks.push(track);
    }
    // Limit tracks cache to recent 50
    if (this.data.tracks.length > 50) {
      this.data.tracks = this.data.tracks.slice(-50);
    }
    return track;
  }

  public clearTracks(cameraId?: string) {
    if (!this.data.tracks) this.data.tracks = [];
    if (cameraId) {
      this.data.tracks = this.data.tracks.filter((t) => t.cameraId !== cameraId);
    } else {
      this.data.tracks = [];
    }
  }

  // Videos
  public getVideos(): VideoRecord[] {
    return this.data.videos;
  }

  public getVideoById(id: string): VideoRecord | undefined {
    return this.data.videos.find((v) => v.id === id);
  }

  public addVideo(video: VideoRecord): VideoRecord {
    this.data.videos.unshift(video);
    this.save();
    return video;
  }

  public updateVideo(id: string, updates: Partial<VideoRecord>): VideoRecord | undefined {
    const idx = this.data.videos.findIndex((v) => v.id === id);
    if (idx === -1) return undefined;
    this.data.videos[idx] = { ...this.data.videos[idx], ...updates };
    this.save();
    return this.data.videos[idx];
  }

  public deleteVideo(id: string): boolean {
    const initLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter((v) => v.id !== id);
    // Also delete associated detections
    this.data.detections = this.data.detections.filter((d) => d.videoId !== id);
    if (this.data.videos.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Detections
  public getDetections(videoId?: string): Detection[] {
    if (videoId) {
      return this.data.detections.filter((d) => d.videoId === videoId);
    }
    return this.data.detections;
  }

  public addDetections(items: Detection[]) {
    this.data.detections.push(...items);
    this.save();
  }

  public replaceVideoDetections(videoId: string, items: Detection[]) {
    this.data.detections = this.data.detections.filter((d) => d.videoId !== videoId);
    this.data.detections.push(...items);
    this.save();
  }

  // Events
  public getEvents(): SecurityEvent[] {
    return this.data.events;
  }

  public addEvent(event: SecurityEvent): SecurityEvent {
    this.data.events.unshift(event);
    this.save();
    return event;
  }

  public updateEvent(id: string, updates: Partial<SecurityEvent>): SecurityEvent | undefined {
    const idx = this.data.events.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.data.events[idx] = { ...this.data.events[idx], ...updates };
    this.save();
    return this.data.events[idx];
  }

  public deleteEvent(id: string): boolean {
    const initLen = this.data.events.length;
    this.data.events = this.data.events.filter((e) => e.id !== id);
    if (this.data.events.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Alerts
  public getAlerts(): SecurityAlert[] {
    return this.data.alerts;
  }

  public addAlert(alert: SecurityAlert): SecurityAlert {
    this.data.alerts.unshift(alert);
    this.save();
    return alert;
  }

  public acknowledgeAlert(id: string, user: string = 'Security Officer'): SecurityAlert | undefined {
    const alert = this.data.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date().toISOString();
      alert.acknowledgedBy = user;
      this.save();
    }
    return alert;
  }

  public dismissAlert(id: string): SecurityAlert | undefined {
    const alert = this.data.alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = 'dismissed';
      this.save();
    }
    return alert;
  }

  // Monitoring Rules
  public getRules(): MonitoringRule[] {
    return this.data.rules;
  }

  public addRule(rule: MonitoringRule): MonitoringRule {
    this.data.rules.push(rule);
    this.save();
    return rule;
  }

  public updateRule(id: string, updates: Partial<MonitoringRule>): MonitoringRule | undefined {
    const idx = this.data.rules.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.data.rules[idx] = { ...this.data.rules[idx], ...updates };
    this.save();
    return this.data.rules[idx];
  }

  public deleteRule(id: string): boolean {
    const initLen = this.data.rules.length;
    this.data.rules = this.data.rules.filter((r) => r.id !== id);
    if (this.data.rules.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Investigations
  public getInvestigations(): Investigation[] {
    return this.data.investigations;
  }

  public getInvestigationById(id: string): Investigation | undefined {
    return this.data.investigations.find((inv) => inv.id === id);
  }

  public addInvestigation(inv: Investigation): Investigation {
    this.data.investigations.unshift(inv);
    this.save();
    return inv;
  }

  public updateInvestigation(id: string, updates: Partial<Investigation>): Investigation | undefined {
    const idx = this.data.investigations.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.investigations[idx] = {
      ...this.data.investigations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.investigations[idx];
  }

  // Memory
  public getMemory(): MemoryEntry[] {
    return this.data.memory;
  }

  public saveMemory(key: string, value: string, context?: string): MemoryEntry {
    const existing = this.data.memory.find((m) => m.key.toLowerCase() === key.toLowerCase());
    if (existing) {
      existing.value = value;
      existing.context = context || existing.context;
      existing.confirmed = true;
      this.save();
      return existing;
    }
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}`,
      key,
      value,
      confirmed: true,
      context,
      createdAt: new Date().toISOString(),
    };
    this.data.memory.push(entry);
    this.save();
    return entry;
  }

  public deleteMemory(id: string): boolean {
    const initLen = this.data.memory.length;
    this.data.memory = this.data.memory.filter((m) => m.id !== id);
    if (this.data.memory.length !== initLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Notifications
  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public addNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach((n) => (n.read = true));
    this.save();
  }

  // Settings
  public getSettings(): UserSettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<UserSettings>): UserSettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
