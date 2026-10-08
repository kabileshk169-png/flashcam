# FLASH CAM — PART 2 LIVE VERIFICATION
## Autonomous Implementation Plan

### Executive Architecture Overview
FLASH CAM combines **Part 1 (Recorded Video Verification)** and **Part 2 (Live CCTV & Stream Verification)** into a single, unified enterprise AI video intelligence platform.

The live streaming architecture is designed as follows:
```
[ Real CCTV / RTSP Camera ]  OR  [ Hardware Camera / WebRTC Adapter ]  OR  [ Authenticated Demo CCTV Gateway ]
                                  ↓
                        [ Streaming Gateway ]
                   (RTSP / HLS / WebRTC / MSE / HTTP)
                                  ↓
                        [ Browser Player ]
        (Multi-layout: 1, 2, 4, 6, 9, 12, 16 cameras + Expanded Tile)
                                  ↓
                     [ Live AI Detection & Sampling ]
                  (Gemini Vision + Client Frame Sampling)
                                  ↓
                       [ Live Object Tracking ]
                 (Track IDs: Person #17, Red Bag #04, etc.)
                                  ↓
                        [ Real-Time Events ]
            (Live Detections, Crossings, Movement, Offline)
                                  ↓
                       [ Monitoring Rules Engine ]
      (User-defined open-vocabulary triggers with cooldown & actions)
                                  ↓
                    [ Alerts & Notification System ]
              (In-app banner/modal, Audio alarm, Browser alert)
                                  ↓
                 [ AI Agent & Voice Assistant Tools ]
            (Natural language queries, camera controls, PTZ, memory)
```

---

### Implementation Milestones

#### MILESTONE 1: Live Camera Data Model
- Extend `Camera` model with:
  - `id`: unique ID (e.g. `cam-01`)
  - `name`: friendly label (e.g. `Perimeter Entrance North`)
  - `ip`: IP/Host
  - `rtspUrl`: sanitized RTSP endpoint (credentials scrubbed before client transmission)
  - `username` / `password`: securely held in backend credential vault, never transmitted to client JavaScript or logged
  - `channel`: channel index (e.g. `1`)
  - `location`: sector location (e.g. `Main Gate`)
  - `streamPath`: gateway route (e.g. `/live/cam-01/stream.m3u8` or WebRTC endpoint)
  - `transport`: `tcp` | `udp` | `webrtc` | `hls`
  - `enabled`: boolean
  - `status`: `connecting` | `online` | `degraded` | `offline` | `auth_failed` | `stream_error`
  - `lastSeen`: ISO timestamp
  - `capabilities`: `{ ptz: boolean, audio: boolean, multiStream: boolean, zoom: boolean, presets: string[] }`
  - `sourceType`: `'rtsp' | 'webrtc' | 'hls' | 'mjpeg' | 'device' | 'demo'`
  - `streams`: `{ high?: string; standard?: string; smooth?: string }`
  - `fps`, `resolution`, `bitrate`, `latencyMs`

#### MILESTONE 2: RTSP Ingestion Pipeline
- Server-side RTSP probe & validation using `ffmpeg` / `ffprobe` (or socket ping)
- Ingestion validator endpoint: `POST /api/cameras/test-connection`
- Safe RTSP URL parser that extracts credentials and stores them securely in the backend, preventing any exposure.
- Real status calculation based on probe response, ping, or simulated stream heartbeat.

#### MILESTONE 3: Streaming Gateway
- Multi-protocol gateway adapter:
  - HLS endpoint generation (`/api/streams/:id/hls`) or direct WebRTC peer connections where supported
  - High-performance live MJPEG / canvas stream bridge
  - Clearly labeled **DEMO CCTV STREAM** adapter with realistic high-frame CCTV rendering (telemetry, simulated movement, timecode, status) when external RTSP hardware is not physically present in the cloud container.
  - Strict rule: **Never pretend the demo stream is a real CCTV camera**; clearly label source mode as `DEMO CCTV GATEWAY` or `REAL RTSP NODE`.

#### MILESTONE 4: WebRTC / HLS Browser Playback
- Universal live video renderer supporting:
  - HLS / WebRTC / Video DOM streams
  - Hardware device camera (`navigator.mediaDevices.getUserMedia`)
  - Demo stream gateway adapter with real-time frame canvas
- Stream quality toggle (High / Standard / Smooth) when multiStream capability is enabled
- Low-latency buffer tuning and automatic reconnection on stream drop.

#### MILESTONE 5: Live Camera Dashboard & Multi-Camera Layouts
- Layouts supported: **1, 2, 4, 6, 9, 12, 16 cameras**
- Each tile displays:
  - Camera name & ID
  - Real status indicator (`ONLINE`, `CONNECTING`, `OFFLINE`, `AUTH_FAILED`)
  - LIVE blinking badge
  - Resolution & FPS readout
  - Fullscreen, Mute/Unmute, Snapshot, Record toggle
  - AI Detection overlay toggle
  - PTZ controls toggle (when camera capability supports PTZ; shows "PTZ unavailable for this camera" when unsupported)
- Click tile to expand into focused deep-dive operator view.

#### MILESTONE 6: Live AI Detection (Open Vocabulary)
- Periodic frame sampling pipeline (configurable interval, default 3s)
- Gemini Vision powered open-vocabulary detection supporting natural language concepts ("red bag", "person carrying heavy object", "white SUV", "restricted perimeter crossing")
- Returns bounding boxes, labels, confidence scores, category, and security description.

#### MILESTONE 7: Real Object Tracking
- Temporal tracking engine assigning continuous Track IDs:
  - `Person #17`
  - `Red Bag #04`
  - `Vehicle #08`
- Retains track duration, trajectory vector, last seen timestamp, and bounding box progression.

#### MILESTONE 8: Live Events Engine
- Auto-registers events in database:
  - `Object detected`
  - `Object tracked`
  - `Rule triggered`
  - `Camera online / offline`
  - `Stream error`
  - `Recording started / stopped`
  - `Movement / perimeter intrusion`
- Captures verified frame snapshots as evidence.

#### MILESTONE 9: Monitoring Rules
- User-defined rule engine:
  - Target object query (open vocabulary, e.g. "red bag", "unauthorized individual", "vehicle after hours")
  - Camera binding (specific camera or all cameras)
  - Severity (`critical`, `warning`, `info`)
  - Cooldown timer (prevents alert spamming)
  - Action (`create_alert`, `log_event`, `notify`)
- Dynamic evaluation on every live detection cycle.

#### MILESTONE 10: AI Agent Integration with Real Tools
- Integrated tools:
  - `get_live_cameras`
  - `get_camera_status`
  - `open_live_camera`
  - `get_live_events`
  - `search_live_events`
  - `get_current_detections`
  - `get_active_tracks`
  - `create_monitoring_rule`
  - `enable_monitoring_rule`
  - `disable_monitoring_rule`
  - `get_camera_capabilities`
  - `test_camera_connection`
  - `get_latest_alerts`
  - `open_live_evidence`
  - `take_snapshot`
  - `start_recording`
  - `stop_recording`
- Strictly enforced Confirmation Policy:
  - Read actions: NO confirmation.
  - Write actions (creating rules, updating settings): 1 concise confirmation.
  - Destructive actions (deleting cameras, recordings): Explicit confirmation.

#### MILESTONE 11: Voice Assistant Integration
- Natural language voice commands mapped to real agent tools
- Multilingual regional voice queries (English, Tamil, Hindi, Telugu, Kannada, Malayalam)
- Speech synthesis feedback using Web Speech API or Gemini TTS.

#### MILESTONE 12: Real-time Alerts & Notifications
- Active alert banner and floating alert center
- Browser notification API integration (when permission granted)
- In-app audio chime for critical alerts
- One-click acknowledge / dismiss / create investigation dossier.

#### MILESTONE 13: Security, Privacy & Credential Isolation
- RTSP credentials stripped before sending to frontend
- Passwords never logged in server console
- Visual indicator showing when external AI vision processing is active
- Local-first processing option.

#### MILESTONE 14: Responsive Layouts (1440px / 820px / 390px)
- Desktop: Full multi-camera control room with sidebar, analytics, and telemetry
- Tablet: 2x2 or 2x1 adaptive matrix
- Mobile: Single-tile priority view with bottom switcher and collapsible AI assistant.

#### MILESTONE 15: End-to-End Testing & Verification
- Full automated test verifying:
  - Camera list and connection test
  - Live view stream switching (1, 2, 4, 6 layouts)
  - Snapshot capture and download
  - Recording start/stop with file generation
  - Live AI open-vocabulary detection & object tracking
  - Monitoring rule creation & alert triggering
  - AI Agent chat tool execution
  - Unified search returning both recorded videos and live events.
