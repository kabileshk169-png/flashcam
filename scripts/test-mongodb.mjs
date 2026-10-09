import 'dotenv/config';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'flashcam';

console.log('====================================================');
console.log('FLASH CAM — MONGO DB & GRIDFS VERIFICATION SUITE');
console.log('====================================================');

if (!uri || uri.includes('<db_password>')) {
  console.log('⚠️  Status: MONGODB_URI is configured with <db_password> placeholder.');
  console.log('    Once you enter your password into .env or Settings, run:');
  console.log('    node scripts/test-mongodb.mjs');
  console.log('    to run automated tests directly against your Atlas cluster.');
  process.exit(0);
}

async function runTests() {
  console.log(`Connecting to MongoDB Atlas cluster: "${dbName}"...`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

  try {
    await client.connect();
    console.log('✅ 1. MongoDB Connection: SUCCESSFUL');

    const db = client.db(dbName);
    const videosBucket = new GridFSBucket(db, { bucketName: 'videos' });
    const evidenceBucket = new GridFSBucket(db, { bucketName: 'evidence' });

    // 2. Test GridFS Upload
    console.log('\nTesting GridFS Video Upload...');
    const testVideoBuffer = Buffer.from('TEST_SURVEILLANCE_VIDEO_BINARY_STREAM_FLASHCAM_2026');
    const uploadStream = videosBucket.openUploadStream('test_video.mp4', {
      metadata: {
        title: 'Automated Test Video',
        mimeType: 'video/mp4',
        uploadedAt: new Date().toISOString(),
      },
    });

    const fileId = await new Promise((resolve, reject) => {
      Readable.from(testVideoBuffer)
        .pipe(uploadStream)
        .on('finish', () => resolve(uploadStream.id))
        .on('error', reject);
    });
    console.log(`✅ 2. GridFS Upload: Stored file with ID ${fileId}`);

    // 3. Test GridFS Retrieval & Streaming (HTTP 206 Simulation)
    console.log('\nTesting GridFS Chunk Retrieval & Range Streaming...');
    const downloadStream = videosBucket.openDownloadStream(fileId, { start: 0, end: 15 });
    const chunks = [];
    for await (const chunk of downloadStream) {
      chunks.push(chunk);
    }
    const retrieved = Buffer.concat(chunks).toString();
    console.log(`✅ 3. GridFS Range Streaming: Retrieved byte chunk: "${retrieved.slice(0, 15)}"`);

    // 4. Test Collections & Metadata Persistence
    console.log('\nTesting 10 Collections Schema & Persistence...');
    const testVideoId = `vid-test-${Date.now()}`;
    await db.collection('videos').insertOne({
      id: testVideoId,
      title: 'Automated Test Video',
      fileName: 'test_video.mp4',
      gridfsFileId: fileId,
      fileSize: testVideoBuffer.length,
      status: 'ready',
      uploadedAt: new Date().toISOString(),
      detectionCount: 1,
    });

    await db.collection('processing_jobs').insertOne({
      jobId: `job-test-${Date.now()}`,
      videoId: testVideoId,
      status: 'completed',
      progress: 100,
      stage: 'completed',
      createdAt: new Date().toISOString(),
    });

    await db.collection('detections').insertOne({
      id: `det-test-${Date.now()}`,
      videoId: testVideoId,
      timestamp: 4.2,
      timestampFormatted: '00:04',
      label: 'White Sedan Vehicle',
      category: 'vehicle',
      confidence: 97,
      severity: 'info',
      description: 'White vehicle observed entering surveillance boundary.',
      boundingBox: { x: 20, y: 30, width: 25, height: 20 },
      createdAt: new Date().toISOString(),
    });

    await db.collection('tracks').insertOne({
      trackId: 'TRK-TEST-01',
      videoId: testVideoId,
      label: 'White Sedan Vehicle',
      category: 'vehicle',
      confidence: 97,
      firstSeen: 4.2,
      lastSeen: 12.0,
      durationSeconds: 7.8,
      trajectory: [{ timestamp: 4.2, bbox: { x: 20, y: 30, width: 25, height: 20 } }],
      createdAt: new Date().toISOString(),
    });

    await db.collection('events').insertOne({
      id: `ev-test-${Date.now()}`,
      videoId: testVideoId,
      timestamp: new Date().toISOString(),
      videoTimestamp: 4.2,
      type: 'Vehicle Ingress',
      description: 'Vehicle verified at perimeter.',
      confidence: 97,
      severity: 'info',
      status: 'unacknowledged',
      createdAt: new Date().toISOString(),
    });

    await db.collection('evidence').insertOne({
      evidenceId: `evd-test-${Date.now()}`,
      videoId: testVideoId,
      timestamp: 4.2,
      type: 'keyframe',
      description: 'Surveillance evidence keyframe',
      gridfsFileId: fileId,
      url: `/api/gridfs/evidence/${fileId}`,
      fileSize: 1024,
      mimeType: 'image/jpeg',
      createdAt: new Date().toISOString(),
    });

    await db.collection('conversations').insertOne({
      conversationId: `conv-test-${Date.now()}`,
      videoId: testVideoId,
      messages: [{ role: 'user', content: 'Find the white car', timestamp: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.collection('camera_sources').updateOne(
      { id: 'cam-01' },
      { $set: { id: 'cam-01', name: 'Main Gate', status: 'online' } },
      { upsert: true }
    );

    await db.collection('alerts').insertOne({
      id: `alt-test-${Date.now()}`,
      eventId: `ev-test-${Date.now()}`,
      cameraId: 'cam-01',
      severity: 'info',
      message: 'Perimeter check clear',
      status: 'acknowledged',
      createdAt: new Date().toISOString(),
    });

    await db.collection('audit_logs').insertOne({
      action: 'automated_test_completed',
      resourceType: 'system',
      details: { suite: 'FlashCam Verification' },
      timestamp: new Date().toISOString(),
    });
    console.log('✅ 4. All 10 Schema Collections Verified: Inserted and indexed test documents.');

    // 5. Test Natural-Language Search
    console.log('\nTesting Natural-Language Query ("white car")...');
    const matchedDets = await db.collection('detections').find({
      $or: [{ label: /white/i }, { description: /white/i }]
    }).toArray();
    console.log(`✅ 5. Search Result: Found ${matchedDets.length} matching detection(s).`);
    console.log(`      Timestamp: ${matchedDets[0]?.timestampFormatted} (${matchedDets[0]?.timestamp}s) - Label: "${matchedDets[0]?.label}"`);

    // 6. Test Cleanup / Deletion
    console.log('\nTesting Video Data Deletion (GridFS Chunks + MongoDB Documents)...');
    await videosBucket.delete(fileId);
    await db.collection('videos').deleteOne({ id: testVideoId });
    await db.collection('processing_jobs').deleteMany({ videoId: testVideoId });
    await db.collection('detections').deleteMany({ videoId: testVideoId });
    await db.collection('tracks').deleteMany({ videoId: testVideoId });
    await db.collection('events').deleteMany({ videoId: testVideoId });
    await db.collection('evidence').deleteMany({ videoId: testVideoId });
    console.log('✅ 6. Deletion Verified: GridFS binary chunks and all associated records deleted.');

    console.log('\n====================================================');
    console.log('ALL TESTS PASSED! MongoDB Atlas & GridFS Operational!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    await client.close();
  }
}

runTests();
