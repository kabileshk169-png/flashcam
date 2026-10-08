import {
  Camera,
  VideoRecord,
  Detection,
  SecurityEvent,
  SecurityAlert,
  MonitoringRule,
  Investigation,
  NotificationItem,
  UserSettings,
  MemoryEntry,
  SystemMetrics,
  ExportClipRequest,
  ExportClipResult,
  SnapshotRecord,
  LiveRecording,
  LiveTrack,
  DemoVideoItem,
  ReferenceVideoItem,
  SearchMatchResult,
} from '../types';

export const api = {
  // Health
  async getHealth(): Promise<{ status: string; timestamp: string; geminiAvailable: boolean }> {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Overview
  async getMetrics(): Promise<SystemMetrics> {
    const res = await fetch('/api/overview/metrics');
    return res.json();
  },

  // Cameras
  async getCameras(): Promise<Camera[]> {
    const res = await fetch('/api/cameras');
    return res.json();
  },

  async addCamera(data: Partial<Camera>): Promise<Camera> {
    const res = await fetch('/api/cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add camera');
    return res.json();
  },

  async updateCamera(id: string, updates: Partial<Camera>): Promise<Camera> {
    const res = await fetch(`/api/cameras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update camera');
    return res.json();
  },

  async deleteCamera(id: string): Promise<void> {
    const res = await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete camera');
  },

  async testCamera(id: string): Promise<{ status: string; latencyMs: number; message: string }> {
    const res = await fetch(`/api/cameras/${id}/test`, { method: 'POST' });
    return res.json();
  },

  async testNewCameraConnection(params: {
    ip?: string;
    rtspUrl?: string;
    username?: string;
    password?: string;
    sourceType?: string;
    isDemo?: boolean;
  }): Promise<{
    status: string;
    latencyMs: number;
    message: string;
    valid?: boolean;
    gatewayVerified?: boolean;
    gatewayProtocol?: string;
    sanitizedUrl?: string;
    transport?: string;
    extractedCredentials?: boolean;
    resolution?: string;
    fps?: number;
    bitrateKbps?: number;
    codec?: string;
    sourceType?: string;
    error?: string;
  }> {
    const res = await fetch('/api/cameras/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async discoverCameras(): Promise<{
    status: string;
    networkInterface: string;
    discoveredNodes: any[];
    limitationNote: string;
  }> {
    const res = await fetch('/api/cameras/discover', { method: 'POST' });
    return res.json();
  },

  async ptzControl(
    id: string,
    action: string,
    presetName?: string,
    speed?: number
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const res = await fetch(`/api/cameras/${id}/ptz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, presetName, speed }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'PTZ command failed');
    }
    return res.json();
  },

  async takeSnapshot(
    id: string,
    frameBase64?: string,
    resolution?: string,
    user?: string
  ): Promise<SnapshotRecord> {
    const res = await fetch(`/api/cameras/${id}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameBase64, resolution, user }),
    });
    if (!res.ok) throw new Error('Failed to take snapshot');
    return res.json();
  },

  async getSnapshots(cameraId?: string): Promise<SnapshotRecord[]> {
    const url = cameraId ? `/api/cameras/${cameraId}/snapshots` : '/api/snapshots';
    const res = await fetch(url);
    return res.json();
  },

  async startRecording(id: string): Promise<LiveRecording> {
    const res = await fetch(`/api/cameras/${id}/record/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start recording');
    return res.json();
  },

  async stopRecording(id: string, recordingId?: string): Promise<LiveRecording> {
    const res = await fetch(`/api/cameras/${id}/record/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordingId }),
    });
    if (!res.ok) throw new Error('Failed to stop recording');
    return res.json();
  },

  async getRecordings(): Promise<LiveRecording[]> {
    const res = await fetch('/api/recordings');
    return res.json();
  },

  async getCameraTracks(cameraId: string): Promise<LiveTrack[]> {
    const res = await fetch(`/api/cameras/${cameraId}/tracks`);
    return res.json();
  },

  async saveCameraTrack(cameraId: string, track: LiveTrack): Promise<LiveTrack> {
    const res = await fetch(`/api/cameras/${cameraId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    });
    return res.json();
  },

  async getLiveEvents(cameraId?: string): Promise<SecurityEvent[]> {
    const url = cameraId ? `/api/live/events?cameraId=${cameraId}` : '/api/live/events';
    const res = await fetch(url);
    return res.json();
  },

  // Videos
  async getVideos(): Promise<VideoRecord[]> {
    const res = await fetch('/api/videos');
    return res.json();
  },

  async getVideo(id: string): Promise<VideoRecord> {
    const res = await fetch(`/api/videos/${id}`);
    if (!res.ok) throw new Error('Video not found');
    return res.json();
  },

  async uploadVideo(file: File, title?: string, cameraId?: string): Promise<VideoRecord> {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    if (cameraId) formData.append('cameraId', cameraId);

    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  async deleteVideo(id: string): Promise<void> {
    const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete video');
  },

  async analyzeVideo(
    id: string,
    frames: Array<{ timestamp: number; timestampFormatted: string; base64Data: string }>,
    duration?: number
  ): Promise<{ success: boolean; detectionCount: number; detections: Detection[] }> {
    const res = await fetch(`/api/videos/${id}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, duration }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Analysis failed');
    }
    return res.json();
  },

  async exportClip(
    id: string,
    params: ExportClipRequest
  ): Promise<ExportClipResult & { fallbackToClient?: boolean; message?: string }> {
    const res = await fetch(`/api/videos/${id}/export-clip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to export video clip');
    }
    return res.json();
  },

  // Live Frame Analysis
  async analyzeLiveFrame(
    frameData: string,
    cameraId?: string,
    cameraName?: string
  ): Promise<{ detections: Detection[]; alertsTriggered: SecurityAlert[] }> {
    const res = await fetch('/api/live/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameData, cameraId, cameraName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Live analysis failed');
    }
    return res.json();
  },

  // Detections
  async getDetections(videoId?: string): Promise<Detection[]> {
    const url = videoId ? `/api/detections?videoId=${videoId}` : '/api/detections';
    const res = await fetch(url);
    return res.json();
  },

  // Events
  async getEvents(): Promise<SecurityEvent[]> {
    const res = await fetch('/api/events');
    return res.json();
  },

  async addEvent(event: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return res.json();
  },

  async updateEvent(id: string, updates: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteEvent(id: string): Promise<void> {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
  },

  // Alerts
  async getAlerts(): Promise<SecurityAlert[]> {
    const res = await fetch('/api/alerts');
    return res.json();
  },

  async acknowledgeAlert(id: string, user?: string): Promise<SecurityAlert> {
    const res = await fetch(`/api/alerts/${id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    });
    return res.json();
  },

  async dismissAlert(id: string): Promise<SecurityAlert> {
    const res = await fetch(`/api/alerts/${id}/dismiss`, { method: 'POST' });
    return res.json();
  },

  // Rules
  async getRules(): Promise<MonitoringRule[]> {
    const res = await fetch('/api/rules');
    return res.json();
  },

  async addRule(rule: Partial<MonitoringRule>): Promise<MonitoringRule> {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to add rule');
    return res.json();
  },

  async updateRule(id: string, updates: Partial<MonitoringRule>): Promise<MonitoringRule> {
    const res = await fetch(`/api/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async deleteRule(id: string): Promise<void> {
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
  },

  // Investigations
  async getInvestigations(): Promise<Investigation[]> {
    const res = await fetch('/api/investigations');
    return res.json();
  },

  async getInvestigation(id: string): Promise<Investigation> {
    const res = await fetch(`/api/investigations/${id}`);
    if (!res.ok) throw new Error('Investigation not found');
    return res.json();
  },

  async addInvestigation(inv: Partial<Investigation>): Promise<Investigation> {
    const res = await fetch('/api/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv),
    });
    return res.json();
  },

  async updateInvestigation(id: string, updates: Partial<Investigation>): Promise<Investigation> {
    const res = await fetch(`/api/investigations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  async addInvestigationNote(id: string, text: string, author?: string): Promise<any> {
    const res = await fetch(`/api/investigations/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, author }),
    });
    return res.json();
  },

  // Search
  async search(query: string): Promise<any> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  // AI Agent Chat
  async chatWithAgent(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<{
    reply: string;
    toolCallsExecuted: Array<{ name: string; args: any; result: any }>;
    clientActions: Array<{ action: string; payload: any }>;
  }> {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory }),
    });
    return res.json();
  },

  // Memory
  async getMemory(): Promise<MemoryEntry[]> {
    const res = await fetch('/api/memory');
    return res.json();
  },

  async saveMemory(key: string, value: string, context?: string): Promise<MemoryEntry> {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, context }),
    });
    return res.json();
  },

  async deleteMemory(id: string): Promise<void> {
    await fetch(`/api/memory/${id}`, { method: 'DELETE' });
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'POST' });
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // TTS
  async textToSpeech(text: string): Promise<{ available: boolean; audioBase64?: string }> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  // Reports
  async generateReport(data: {
    title?: string;
    cameraId?: string;
    dateRange?: string;
    includeEvidence?: boolean;
  }): Promise<any> {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Real-World Demo Library
  async getDemos(): Promise<{
    demos: DemoVideoItem[];
    references: ReferenceVideoItem[];
    totalCount: number;
    scenarios: Array<{ id: string; label: string }>;
  }> {
    const res = await fetch('/api/demos');
    if (!res.ok) throw new Error('Failed to load demo library');
    return res.json();
  },

  async getDemo(id: string): Promise<DemoVideoItem> {
    const res = await fetch(`/api/demos/${id}`);
    if (!res.ok) throw new Error('Failed to load demo video details');
    return res.json();
  },

  async analyzeDemo(id: string): Promise<any> {
    const res = await fetch(`/api/demos/${id}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error('Demo analysis failed');
    return res.json();
  },

  async searchDemos(query: string, demoId?: string): Promise<SearchMatchResult> {
    const res = await fetch('/api/demos/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, demoId }),
    });
    if (!res.ok) throw new Error('Demo conversational search failed');
    return res.json();
  },

  async getReferenceVideos(): Promise<ReferenceVideoItem[]> {
    const res = await fetch('/api/demos/references');
    if (!res.ok) throw new Error('Failed to load reference videos');
    return res.json();
  },
};

