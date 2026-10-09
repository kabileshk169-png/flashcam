import { MongoClient, Db, GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

// Types for MongoDB collections
export interface MongoVideoDoc {
  _id?: ObjectId;
  id: string; // vid-timestamp
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  duration?: number;
  status: 'queued' | 'processing' | 'analyzing' | 'ready' | 'failed';
  gridfsFileId?: ObjectId;
  url: string;
  cameraId?: string;
  uploadedAt: string;
  processedAt?: string;
  detectionCount: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface MongoProcessingJob {
  _id?: ObjectId;
  jobId: string;
  videoId: string;
  videoTitle: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 - 100
  stage: 'queued' | 'extracting_frames' | 'running_ai_detection' | 'tracking_objects' | 'storing_evidence' | 'completed';
  error?: string;
  framesAnalyzed?: number;
  detectionsFound?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface MongoDetection {
  _id?: ObjectId;
  id: string;
  videoId: string;
  cameraId?: string;
  timestamp: number;
  timestampFormatted: string;
  label: string;
  category: 'person' | 'vehicle' | 'bag' | 'hazard' | 'object' | 'general';
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  evidenceFrameUrl?: string;
  evidenceGridfsId?: ObjectId;
  trackId?: string;
  verified: boolean;
  createdAt: string;
}

export interface MongoTrack {
  _id?: ObjectId;
  trackId: string;
  videoId: string;
  label: string;
  category: string;
  confidence: number;
  firstSeen: number;
  lastSeen: number;
  durationSeconds: number;
  trajectory: Array<{ timestamp: number; bbox: { x: number; y: number; width: number; height: number } }>;
  createdAt: string;
}

export interface MongoSecurityEvent {
  _id?: ObjectId;
  id: string;
  source: 'live_camera' | 'video_verification' | 'system';
  videoId?: string;
  videoTitle?: string;
  cameraId?: string;
  cameraName?: string;
  timestamp: string;
  videoTimestamp?: number;
  type: string;
  description: string;
  confidence: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'unacknowledged' | 'acknowledged' | 'investigating' | 'dismissed';
  evidenceFrameUrl?: string;
  evidenceGridfsId?: ObjectId;
  createdAt: string;
}

export interface MongoEvidence {
  _id?: ObjectId;
  evidenceId: string;
  videoId: string;
  timestamp: number;
  type: 'keyframe' | 'clip' | 'snapshot';
  description: string;
  gridfsFileId: ObjectId;
  url: string;
  fileSize: number;
  mimeType: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MongoConversation {
  _id?: ObjectId;
  conversationId: string;
  videoId?: string;
  title?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    context?: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MongoCameraSource {
  _id?: ObjectId;
  id: string;
  name: string;
  location: string;
  group: string;
  sourceType: string;
  sourceUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  status: string;
  enabled: boolean;
  fps?: number;
  resolution?: string;
  bitrateKbps?: number;
  latencyMs?: number;
  capabilities: any;
  createdAt: string;
}

export interface MongoAlert {
  _id?: ObjectId;
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

export interface MongoAuditLog {
  _id?: ObjectId;
  action: string;
  resourceType: 'video' | 'job' | 'detection' | 'camera' | 'alert' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

class MongoDBManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private videosBucket: GridFSBucket | null = null;
  private evidenceBucket: GridFSBucket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private lastError: string | null = null;

  public get isConnected(): boolean {
    return this.connected;
  }

  public get connectionError(): string | null {
    return this.lastError;
  }

  public get database(): Db | null {
    return this.db;
  }

  public get videoStorageBucket(): GridFSBucket | null {
    return this.videosBucket;
  }

  public get evidenceStorageBucket(): GridFSBucket | null {
    return this.evidenceBucket;
  }

  /**
   * Connect to MongoDB Atlas cluster
   */
  public async connect(): Promise<boolean> {
    if (this.connected && this.db) return true;
    if (this.connecting) return false;

    this.connecting = true;
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DATABASE || 'flashcam';

    if (!uri) {
      this.lastError = 'MONGODB_URI is not set in environment';
      this.connecting = false;
      console.warn('[MongoDB] Warning:', this.lastError);
      return false;
    }

    if (uri.includes('<db_password>')) {
      this.lastError = 'MONGODB_URI contains placeholder <db_password>. Please provide your database password.';
      this.connecting = false;
      console.warn('[MongoDB] Pending Configuration:', this.lastError);
      return false;
    }

    try {
      console.log(`[MongoDB] Connecting to MongoDB Atlas database "${dbName}"...`);
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
        maxPoolSize: 25,
        minPoolSize: 2,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);

      // Initialize GridFS Buckets
      this.videosBucket = new GridFSBucket(this.db, { bucketName: 'videos' });
      this.evidenceBucket = new GridFSBucket(this.db, { bucketName: 'evidence' });

      this.connected = true;
      this.connecting = false;
      this.lastError = null;

      console.log(`[MongoDB] Successfully connected to Atlas! Database: "${dbName}"`);

      // Initialize collections and indexes asynchronously
      await this.initIndexes();
      await this.logAudit('db_connected', 'system', undefined, { database: dbName });

      return true;
    } catch (err: any) {
      this.connected = false;
      this.connecting = false;
      this.lastError = err?.message || 'Failed to connect to MongoDB';
      console.error('[MongoDB] Connection failure:', this.lastError);
      return false;
    }
  }

  /**
   * Reconnect with updated URI
   */
  public async reconnectWithUri(newUri: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.client) {
        try {
          await this.client.close();
        } catch {
          // ignore close errors
        }
      }
      this.connected = false;
      this.client = null;
      this.db = null;
      process.env.MONGODB_URI = newUri;
      const ok = await this.connect();
      return { success: ok, error: this.lastError || undefined };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Setup performance and search indexes
   */
  private async initIndexes(): Promise<void> {
    if (!this.db) return;
    try {
      // 1. videos indexes
      const videosCol = this.db.collection('videos');
      await videosCol.createIndex({ id: 1 }, { unique: true });
      await videosCol.createIndex({ uploadedAt: -1 });
      await videosCol.createIndex({ status: 1 });
      await videosCol.createIndex({ title: 'text', fileName: 'text' });

      // 2. processing_jobs indexes
      const jobsCol = this.db.collection('processing_jobs');
      await jobsCol.createIndex({ jobId: 1 }, { unique: true });
      await jobsCol.createIndex({ videoId: 1 });
      await jobsCol.createIndex({ status: 1 });

      // 3. detections indexes + text index
      const detsCol = this.db.collection('detections');
      await detsCol.createIndex({ id: 1 }, { unique: true });
      await detsCol.createIndex({ videoId: 1, timestamp: 1 });
      await detsCol.createIndex({ category: 1, severity: 1 });
      await detsCol.createIndex({ label: 'text', description: 'text', category: 'text' });

      // 4. tracks indexes
      const tracksCol = this.db.collection('tracks');
      await tracksCol.createIndex({ trackId: 1, videoId: 1 });
      await tracksCol.createIndex({ videoId: 1 });

      // 5. events indexes + text index
      const eventsCol = this.db.collection('events');
      await eventsCol.createIndex({ id: 1 }, { unique: true });
      await eventsCol.createIndex({ videoId: 1, videoTimestamp: 1 });
      await eventsCol.createIndex({ timestamp: -1 });
      await eventsCol.createIndex({ severity: 1, status: 1 });
      await eventsCol.createIndex({ type: 'text', description: 'text' });

      // 6. evidence indexes
      const evidenceCol = this.db.collection('evidence');
      await evidenceCol.createIndex({ evidenceId: 1 }, { unique: true });
      await evidenceCol.createIndex({ videoId: 1, timestamp: 1 });

      // 7. conversations indexes
      const convosCol = this.db.collection('conversations');
      await convosCol.createIndex({ conversationId: 1 }, { unique: true });
      await convosCol.createIndex({ videoId: 1 });

      // 8. camera_sources indexes
      const camsCol = this.db.collection('camera_sources');
      await camsCol.createIndex({ id: 1 }, { unique: true });

      // 9. alerts indexes
      const alertsCol = this.db.collection('alerts');
      await alertsCol.createIndex({ id: 1 }, { unique: true });
      await alertsCol.createIndex({ status: 1, severity: 1 });

      // 10. audit_logs indexes
      const auditCol = this.db.collection('audit_logs');
      await auditCol.createIndex({ timestamp: -1 });
      await auditCol.createIndex({ resourceType: 1, resourceId: 1 });

      console.log('[MongoDB] All collections and performance indexes successfully initialized.');
    } catch (err: any) {
      console.warn('[MongoDB] Index creation notice:', err?.message);
    }
  }

  // ----------------------------------------------------
  // GRIDFS STREAMING OPERATIONS
  // ----------------------------------------------------

  /**
   * Upload video stream directly into MongoDB GridFS
   */
  public uploadVideoToGridFS(
    filename: string,
    fileStream: Readable,
    options: {
      mimeType: string;
      title: string;
      fileSize: number;
      videoId: string;
      cameraId?: string;
    }
  ): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      if (!this.videosBucket) {
        return reject(new Error('MongoDB GridFS videos bucket not available.'));
      }

      const uploadStream = this.videosBucket.openUploadStream(filename, {
        metadata: {
          mimeType: options.mimeType,
          title: options.title,
          fileSize: options.fileSize,
          videoId: options.videoId,
          cameraId: options.cameraId,
          uploadedAt: new Date().toISOString(),
        },
      });

      fileStream
        .pipe(uploadStream)
        .on('error', (err) => {
          console.error('[GridFS] Upload error:', err);
          reject(err);
        })
        .on('finish', () => {
          console.log(`[GridFS] Video stored in MongoDB with GridFS ID: ${uploadStream.id}`);
          resolve(uploadStream.id);
        });
    });
  }

  /**
   * Open download stream from GridFS with range support (HTTP 206 Partial Content)
   */
  public getVideoGridFSStream(fileId: ObjectId | string, range?: { start: number; end: number }) {
    if (!this.videosBucket) {
      throw new Error('GridFS videos bucket not available');
    }
    const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    return this.videosBucket.openDownloadStream(id, range ? { start: range.start, end: range.end } : undefined);
  }

  /**
   * Get GridFS file metadata
   */
  public async getGridFSFileMetadata(fileId: ObjectId | string) {
    if (!this.videosBucket) return null;
    const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    const files = await this.videosBucket.find({ _id: id }).toArray();
    return files[0] || null;
  }

  /**
   * Delete video from GridFS
   */
  public async deleteVideoFromGridFS(fileId: ObjectId | string): Promise<boolean> {
    if (!this.videosBucket) return false;
    try {
      const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
      await this.videosBucket.delete(id);
      return true;
    } catch (err) {
      console.warn('[GridFS] Delete video error:', err);
      return false;
    }
  }

  /**
   * Upload evidence keyframe to GridFS
   */
  public uploadEvidenceToGridFS(
    filename: string,
    buffer: Buffer,
    options: {
      mimeType: string;
      videoId: string;
      timestamp: number;
      description: string;
    }
  ): Promise<ObjectId> {
    return new Promise((resolve, reject) => {
      if (!this.evidenceBucket) {
        return reject(new Error('GridFS evidence bucket not available'));
      }

      const stream = Readable.from(buffer);
      const uploadStream = this.evidenceBucket.openUploadStream(filename, {
        metadata: {
          mimeType: options.mimeType,
          videoId: options.videoId,
          timestamp: options.timestamp,
          description: options.description,
          createdAt: new Date().toISOString(),
        },
      });

      stream
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve(uploadStream.id));
    });
  }

  /**
   * Stream evidence frame from GridFS
   */
  public getEvidenceGridFSStream(fileId: ObjectId | string) {
    if (!this.evidenceBucket) {
      throw new Error('GridFS evidence bucket not available');
    }
    const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    return this.evidenceBucket.openDownloadStream(id);
  }

  // ----------------------------------------------------
  // VIDEO METADATA & MANAGEMENT
  // ----------------------------------------------------

  public async saveVideo(video: MongoVideoDoc): Promise<MongoVideoDoc> {
    if (!this.db) throw new Error('Database not connected');
    const col = this.db.collection<MongoVideoDoc>('videos');
    await col.updateOne({ id: video.id }, { $set: video }, { upsert: true });
    await this.logAudit('video_saved', 'video', video.id, { title: video.title });
    return video;
  }

  public async getVideos(): Promise<MongoVideoDoc[]> {
    if (!this.db) return [];
    return this.db.collection<MongoVideoDoc>('videos').find().sort({ uploadedAt: -1 }).toArray();
  }

  public async getVideoById(id: string): Promise<MongoVideoDoc | null> {
    if (!this.db) return null;
    return this.db.collection<MongoVideoDoc>('videos').findOne({ id });
  }

  public async updateVideo(id: string, updates: Partial<MongoVideoDoc>): Promise<boolean> {
    if (!this.db) return false;
    const res = await this.db.collection<MongoVideoDoc>('videos').updateOne({ id }, { $set: updates });
    return res.matchedCount > 0;
  }

  public async deleteVideo(id: string): Promise<boolean> {
    if (!this.db) return false;
    const video = await this.getVideoById(id);
    if (video && video.gridfsFileId) {
      await this.deleteVideoFromGridFS(video.gridfsFileId);
    }
    // Delete related records
    await this.db.collection('videos').deleteOne({ id });
    await this.db.collection('processing_jobs').deleteMany({ videoId: id });
    await this.db.collection('detections').deleteMany({ videoId: id });
    await this.db.collection('tracks').deleteMany({ videoId: id });
    await this.db.collection('events').deleteMany({ videoId: id });
    await this.db.collection('evidence').deleteMany({ videoId: id });
    await this.logAudit('video_deleted', 'video', id, { title: video?.title });
    return true;
  }

  // ----------------------------------------------------
  // PROCESSING JOBS
  // ----------------------------------------------------

  public async createProcessingJob(videoId: string, videoTitle: string): Promise<MongoProcessingJob> {
    const job: MongoProcessingJob = {
      jobId: `job-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      videoId,
      videoTitle,
      status: 'queued',
      progress: 0,
      stage: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (this.db) {
      await this.db.collection<MongoProcessingJob>('processing_jobs').insertOne(job);
      await this.logAudit('job_created', 'job', job.jobId, { videoId });
    }
    return job;
  }

  public async updateProcessingJob(
    jobId: string,
    updates: Partial<MongoProcessingJob>
  ): Promise<boolean> {
    if (!this.db) return false;
    updates.updatedAt = new Date().toISOString();
    if (updates.status === 'completed') {
      updates.completedAt = new Date().toISOString();
    }
    const res = await this.db
      .collection<MongoProcessingJob>('processing_jobs')
      .updateOne({ jobId }, { $set: updates });
    return res.matchedCount > 0;
  }

  public async getProcessingJob(jobId: string): Promise<MongoProcessingJob | null> {
    if (!this.db) return null;
    return this.db.collection<MongoProcessingJob>('processing_jobs').findOne({ jobId });
  }

  public async getProcessingJobByVideoId(videoId: string): Promise<MongoProcessingJob | null> {
    if (!this.db) return null;
    return this.db
      .collection<MongoProcessingJob>('processing_jobs')
      .find({ videoId })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
  }

  // ----------------------------------------------------
  // DETECTIONS & TRACKS
  // ----------------------------------------------------

  public async saveDetections(detections: MongoDetection[]): Promise<void> {
    if (!this.db || detections.length === 0) return;
    const col = this.db.collection<MongoDetection>('detections');
    const ops = detections.map((det) => ({
      updateOne: {
        filter: { id: det.id },
        update: { $set: det },
        upsert: true,
      },
    }));
    await col.bulkWrite(ops);
  }

  public async getDetectionsByVideoId(videoId: string): Promise<MongoDetection[]> {
    if (!this.db) return [];
    return this.db
      .collection<MongoDetection>('detections')
      .find({ videoId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  public async saveTracks(tracks: MongoTrack[]): Promise<void> {
    if (!this.db || tracks.length === 0) return;
    const col = this.db.collection<MongoTrack>('tracks');
    const ops = tracks.map((track) => ({
      updateOne: {
        filter: { trackId: track.trackId, videoId: track.videoId },
        update: { $set: track },
        upsert: true,
      },
    }));
    await col.bulkWrite(ops);
  }

  public async getTracksByVideoId(videoId: string): Promise<MongoTrack[]> {
    if (!this.db) return [];
    return this.db.collection<MongoTrack>('tracks').find({ videoId }).toArray();
  }

  // ----------------------------------------------------
  // EVENTS & EVIDENCE
  // ----------------------------------------------------

  public async saveEvent(event: MongoSecurityEvent): Promise<void> {
    if (!this.db) return;
    await this.db
      .collection<MongoSecurityEvent>('events')
      .updateOne({ id: event.id }, { $set: event }, { upsert: true });
  }

  public async getEvents(filter: any = {}): Promise<MongoSecurityEvent[]> {
    if (!this.db) return [];
    return this.db.collection<MongoSecurityEvent>('events').find(filter).sort({ timestamp: -1 }).toArray();
  }

  public async saveEvidence(evidence: MongoEvidence): Promise<void> {
    if (!this.db) return;
    await this.db
      .collection<MongoEvidence>('evidence')
      .updateOne({ evidenceId: evidence.evidenceId }, { $set: evidence }, { upsert: true });
  }

  public async getEvidenceByVideoId(videoId: string): Promise<MongoEvidence[]> {
    if (!this.db) return [];
    return this.db.collection<MongoEvidence>('evidence').find({ videoId }).sort({ timestamp: 1 }).toArray();
  }

  // ----------------------------------------------------
  // NATURAL LANGUAGE & TEXT SEARCH
  // ----------------------------------------------------

  public async searchAll(query: string, videoId?: string): Promise<{
    detections: MongoDetection[];
    events: MongoSecurityEvent[];
    evidence: MongoEvidence[];
    tracks: MongoTrack[];
  }> {
    if (!this.db || !query.trim()) {
      return { detections: [], events: [], evidence: [], tracks: [] };
    }

    const regex = new RegExp(query.trim(), 'i');
    const detFilter: any = {
      $or: [{ label: regex }, { description: regex }, { category: regex }],
    };
    if (videoId) detFilter.videoId = videoId;

    const eventFilter: any = {
      $or: [{ type: regex }, { description: regex }, { videoTitle: regex }],
    };
    if (videoId) eventFilter.videoId = videoId;

    const evidenceFilter: any = {
      description: regex,
    };
    if (videoId) evidenceFilter.videoId = videoId;

    const trackFilter: any = {
      $or: [{ label: regex }, { category: regex }],
    };
    if (videoId) trackFilter.videoId = videoId;

    const [detections, events, evidence, tracks] = await Promise.all([
      this.db.collection<MongoDetection>('detections').find(detFilter).limit(25).toArray(),
      this.db.collection<MongoSecurityEvent>('events').find(eventFilter).limit(20).toArray(),
      this.db.collection<MongoEvidence>('evidence').find(evidenceFilter).limit(15).toArray(),
      this.db.collection<MongoTrack>('tracks').find(trackFilter).limit(10).toArray(),
    ]);

    return { detections, events, evidence, tracks };
  }

  // ----------------------------------------------------
  // CONVERSATIONS, CAMERAS, ALERTS & AUDIT LOGS
  // ----------------------------------------------------

  public async saveConversation(convo: MongoConversation): Promise<void> {
    if (!this.db) return;
    await this.db
      .collection<MongoConversation>('conversations')
      .updateOne({ conversationId: convo.conversationId }, { $set: convo }, { upsert: true });
  }

  public async getConversation(conversationId: string): Promise<MongoConversation | null> {
    if (!this.db) return null;
    return this.db.collection<MongoConversation>('conversations').findOne({ conversationId });
  }

  public async saveCameraSources(cameras: MongoCameraSource[]): Promise<void> {
    if (!this.db || cameras.length === 0) return;
    const ops = cameras.map((cam) => ({
      updateOne: {
        filter: { id: cam.id },
        update: { $set: cam },
        upsert: true,
      },
    }));
    await this.db.collection('camera_sources').bulkWrite(ops);
  }

  public async getCameraSources(): Promise<MongoCameraSource[]> {
    if (!this.db) return [];
    return this.db.collection<MongoCameraSource>('camera_sources').find().toArray();
  }

  public async saveAlert(alert: MongoAlert): Promise<void> {
    if (!this.db) return;
    await this.db.collection('alerts').updateOne({ id: alert.id }, { $set: alert }, { upsert: true });
  }

  public async getAlerts(): Promise<MongoAlert[]> {
    if (!this.db) return [];
    return this.db.collection<MongoAlert>('alerts').find().sort({ createdAt: -1 }).toArray();
  }

  public async logAudit(
    action: string,
    resourceType: MongoAuditLog['resourceType'],
    resourceId?: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    if (!this.db) return;
    try {
      const entry: MongoAuditLog = {
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        timestamp: new Date().toISOString(),
      };
      await this.db.collection('audit_logs').insertOne(entry);
    } catch {
      // ignore audit logging failures
    }
  }

  public async getAuditLogs(limit = 50): Promise<MongoAuditLog[]> {
    if (!this.db) return [];
    return this.db.collection<MongoAuditLog>('audit_logs').find().sort({ timestamp: -1 }).limit(limit).toArray();
  }
}

export const mongoManager = new MongoDBManager();
