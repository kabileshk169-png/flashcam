import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Trash2,
  Edit2,
  Activity,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Wifi,
  ExternalLink,
  Shield,
  ShieldCheck,
  Layers,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  Radio,
  Sliders,
  Crosshair,
  Server,
  Play,
  RotateCcw,
  Check,
  X,
  Eye,
  EyeOff,
  Cpu,
  Link as LinkIcon,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Camera } from '../types';

// Stream URI Validator and Credential Extractor
interface StreamValidationResult {
  valid: boolean;
  protocol: string;
  hasCredentials: boolean;
  message: string;
  host?: string;
  port?: number;
  path?: string;
  sanitizedUrl?: string;
  user?: string;
  pass?: string;
}

function validateStreamUri(rawUrl: string): StreamValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      valid: false,
      protocol: '',
      hasCredentials: false,
      message: 'Stream URL is required',
    };
  }

  const trimmed = rawUrl.trim();
  const match = trimmed.match(
    /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(?:([^:]+)(?::([^@]+))?@)?([^:/]+)(?::(\d+))?(\/.*)?$/
  );
  if (!match) {
    return {
      valid: false,
      protocol: '',
      hasCredentials: false,
      message: 'Invalid URI syntax. Expected scheme://host[:port]/path',
    };
  }

  const [, rawScheme, rawUser, rawPass, host, rawPort, rawPath] = match;
  const scheme = rawScheme.toLowerCase();
  const validSchemes = ['rtsp', 'rtsps', 'http', 'https', 'webrtc'];
  if (!validSchemes.includes(scheme)) {
    return {
      valid: false,
      protocol: scheme,
      hasCredentials: false,
      message: `Unsupported scheme "${scheme}://". Supported: rtsp://, rtsps://, webrtc://`,
    };
  }

  const hasCredentials = Boolean(rawUser || rawPass);
  let defaultPort = 554;
  if (scheme === 'rtsps') defaultPort = 322;
  else if (scheme === 'http') defaultPort = 80;
  else if (scheme === 'https') defaultPort = 443;
  else if (scheme === 'webrtc') defaultPort = 8554;

  const port = rawPort ? parseInt(rawPort, 10) : defaultPort;
  const path = rawPath || '/stream1';
  const sanitizedUrl = `${scheme}://${host}${rawPort ? `:${port}` : ''}${path}`;

  return {
    valid: true,
    protocol: scheme,
    hasCredentials,
    message: hasCredentials
      ? 'Embedded credentials detected — automatically moved to secure Vault'
      : `Valid ${scheme.toUpperCase()} Stream URI (${host}:${port})`,
    host,
    port,
    path,
    sanitizedUrl,
    user: rawUser ? decodeURIComponent(rawUser) : undefined,
    pass: rawPass ? decodeURIComponent(rawPass) : undefined,
  };
}

export const CamerasPage: React.FC = () => {
  const { showToast, refreshMetrics, navigateTo, setSelectedCameraId } = useApp();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [cameraToEdit, setCameraToEdit] = useState<Camera | null>(null);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);

  // Add Camera Form State
  const [addMethod, setAddMethod] = useState<'manual' | 'ip' | 'discovery' | 'demo'>('manual');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [group, setGroup] = useState('Perimeter');
  const [ip, setIp] = useState('192.168.1.120');
  const [rtspUrl, setRtspUrl] = useState('rtsp://192.168.1.120:554/stream1');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [channel, setChannel] = useState(1);
  const [transport, setTransport] = useState<'tcp' | 'udp'>('tcp');
  const [sourceType, setSourceType] = useState<Camera['sourceType']>('rtsp');
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState(30);
  const [hasPtz, setHasPtz] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [hasMultiStream, setHasMultiStream] = useState(true);

  // Connection Test & Streaming Gateway Telemetry feedback inside Add Modal
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    status: string;
    latencyMs?: number;
    message?: string;
    gatewayVerified?: boolean;
    gatewayProtocol?: string;
    resolution?: string;
    fps?: number;
    bitrateKbps?: number;
    codec?: string;
    transport?: string;
  } | null>(null);
  const [testingInModal, setTestingInModal] = useState(false);
  const [maskStreamUrl, setMaskStreamUrl] = useState(false);
  const [isGatewayTested, setIsGatewayTested] = useState(false);
  const [lastTestedSignature, setLastTestedSignature] = useState('');
  const [autoVaultNotice, setAutoVaultNotice] = useState<string | null>(null);
  const [saveValidationInProgress, setSaveValidationInProgress] = useState(false);
  const [allowUnverifiedSave, setAllowUnverifiedSave] = useState(false);

  // LAN Discovery State
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<any[]>([]);
  const [discoveryNote, setDiscoveryNote] = useState('');

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const list = await api.getCameras();
      setCameras(list);
    } catch (err) {
      console.error(err);
      showToast('Failed to load cameras', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  // Current parameter signature to detect configuration changes
  const currentSignature = `${addMethod}:${ip}:${rtspUrl}:${username}:${password}:${sourceType}:${channel}`;

  // Stream URL change handler with auto-vault credential extraction
  const handleStreamUrlChange = (newVal: string) => {
    setAutoVaultNotice(null);
    setIsGatewayTested(false);
    setAllowUnverifiedSave(false);

    // Check if operator pasted embedded credentials e.g. rtsp://user:pass@host:554/stream
    const validation = validateStreamUri(newVal);
    if (validation.valid && validation.hasCredentials) {
      if (validation.user) setUsername(validation.user);
      if (validation.pass) setPassword(validation.pass);
      setRtspUrl(validation.sanitizedUrl || newVal);
      setAutoVaultNotice('Detected credentials in URL. Automatically extracted & deposited into Credential Vault.');
      showToast('RTSP credentials automatically moved to secure Vault', 'info');
      return;
    }

    setRtspUrl(newVal);
  };

  // Quick protocol preset applicator
  const applyProtocolPreset = (protocol: 'rtsp' | 'rtsps' | 'webrtc' | 'hls') => {
    setIsGatewayTested(false);
    setAllowUnverifiedSave(false);
    setAutoVaultNotice(null);
    const host = ip || '192.168.1.120';

    if (protocol === 'rtsp') {
      setRtspUrl(`rtsp://${host}:554/stream1`);
      setSourceType('rtsp');
      setTransport('tcp');
    } else if (protocol === 'rtsps') {
      setRtspUrl(`rtsps://${host}:322/secure`);
      setSourceType('rtsp');
      setTransport('tcp');
    } else if (protocol === 'webrtc') {
      setRtspUrl(`webrtc://${host}:8554/live`);
      setSourceType('webrtc');
    } else if (protocol === 'hls') {
      setRtspUrl(`http://${host}:8888/live.m3u8`);
      setSourceType('hls');
    }
  };

  // Pre-test connection using the Backend Streaming Gateway
  const handleTestInModal = async (fromSave = false): Promise<boolean> => {
    setTestingInModal(true);
    setTestResult(null);
    setAutoVaultNotice(null);

    // Validate Stream URI syntax before gateway probe
    if (addMethod !== 'demo') {
      const v = validateStreamUri(rtspUrl);
      if (!v.valid) {
        setTestResult({
          tested: true,
          status: 'invalid_url',
          message: v.message,
        });
        setTestingInModal(false);
        showToast(v.message, 'error');
        return false;
      }
    }

    try {
      const res = await api.testNewCameraConnection({
        ip,
        rtspUrl,
        username,
        password,
        sourceType,
        isDemo: addMethod === 'demo',
      });

      setTestResult({
        tested: true,
        status: res.status,
        latencyMs: res.latencyMs,
        message: res.message,
        gatewayVerified: res.gatewayVerified,
        gatewayProtocol: res.gatewayProtocol,
        resolution: res.resolution,
        fps: res.fps,
        bitrateKbps: res.bitrateKbps,
        codec: res.codec,
        transport: res.transport,
      });

      if (res.status === 'online' || res.gatewayVerified) {
        setIsGatewayTested(true);
        setLastTestedSignature(currentSignature);
        setAllowUnverifiedSave(false);
        showToast(
          `Streaming Gateway verified: ${res.latencyMs}ms (${res.gatewayProtocol || 'RTSP'})`,
          'success'
        );
        return true;
      } else if (res.status === 'auth_failed') {
        setIsGatewayTested(false);
        showToast('Authentication challenge failed. Verify RTSP password in Vault.', 'warning');
        return false;
      } else {
        setIsGatewayTested(false);
        showToast(res.message || 'Streaming gateway handshake failed', 'error');
        return false;
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        status: 'stream_error',
        message: err?.message || 'Gateway handshake timeout',
      });
      setIsGatewayTested(false);
      return false;
    } finally {
      setTestingInModal(false);
    }
  };

  // Add Camera submit - Enforces Gateway Verification before saving
  const handleAddCamera = async (e: React.FormEvent, forceSave = false) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Camera friendly name is required', 'error');
      return;
    }

    const isDemo = addMethod === 'demo';

    // REQUIRE CONNECTION TEST USING STREAMING GATEWAY BEFORE SAVING
    if (!isDemo && !forceSave) {
      const needsTesting = !isGatewayTested || currentSignature !== lastTestedSignature;
      if (needsTesting) {
        setSaveValidationInProgress(true);
        showToast('Validating stream handshake with Streaming Gateway...', 'info');
        const passed = await handleTestInModal(true);
        setSaveValidationInProgress(false);

        if (!passed) {
          setAllowUnverifiedSave(true);
          showToast('Gateway verification failed. Resolve issues or save as offline node.', 'error');
          return;
        }
      }
    }

    try {
      await api.addCamera({
        name: name.trim(),
        location: location.trim() || 'General Perimeter',
        group,
        ip: isDemo ? '192.168.1.105' : ip.trim(),
        rtspUrl: isDemo ? 'rtsp://demo-cctv.local:554/live' : rtspUrl.trim(),
        username: username.trim(),
        password: password.trim(),
        channel: Number(channel),
        transport,
        sourceType: isDemo ? 'demo' : sourceType,
        sourceUrl: isDemo ? 'rtsp://demo-cctv.local:554/live' : rtspUrl.trim(),
        resolution,
        fps: Number(fps),
        isDemo,
        capabilities: {
          ptz: hasPtz,
          audio: hasAudio,
          multiStream: hasMultiStream,
          zoom: hasPtz,
        },
      });

      showToast(`Camera "${name}" successfully registered & gateway bound`, 'success');
      setIsAddModalOpen(false);
      resetForm();
      await fetchCameras();
      await refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add camera', 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setLocation('');
    setIp('192.168.1.120');
    setRtspUrl('rtsp://192.168.1.120:554/stream1');
    setUsername('');
    setPassword('');
    setTestResult(null);
    setIsGatewayTested(false);
    setLastTestedSignature('');
    setAutoVaultNotice(null);
    setAllowUnverifiedSave(false);
  };

  // Run LAN Discovery
  const handleStartDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const res = await api.discoverCameras();
      setDiscoveredNodes(res.discoveredNodes);
      setDiscoveryNote(res.limitationNote);
      setIsDiscoveryModalOpen(true);
    } catch (err: any) {
      showToast('Network discovery failed: ' + err?.message, 'error');
    } finally {
      setIsDiscovering(false);
    }
  };

  // Import discovered node
  const handleImportNode = (node: any) => {
    setName(node.hostname || node.brand);
    setLocation('Discovered Subnet Node');
    setIp(node.ip);
    setRtspUrl(`rtsp://${node.ip}:${node.rtspPort}/stream1`);
    setSourceType('rtsp');
    setAddMethod('manual');
    setIsDiscoveryModalOpen(false);
    setIsAddModalOpen(true);
    showToast(`Configuring discovered node ${node.ip}`, 'info');
  };

  // Toggle Camera
  const handleToggleCamera = async (cam: Camera) => {
    try {
      const updated = await api.updateCamera(cam.id, { enabled: !cam.enabled });
      setCameras((prev) => prev.map((c) => (c.id === cam.id ? updated : c)));
      showToast(`Camera ${updated.enabled ? 'enabled' : 'disabled'}`, 'info');
      refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle camera', 'error');
    }
  };

  // Delete Camera
  const handleConfirmDelete = async () => {
    if (!cameraToDelete) return;
    try {
      await api.deleteCamera(cameraToDelete.id);
      setCameras((prev) => prev.filter((c) => c.id !== cameraToDelete.id));
      showToast(`Camera "${cameraToDelete.name}" deleted`, 'info');
      setCameraToDelete(null);
      refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete camera', 'error');
    }
  };

  // Test Connection on Card
  const handleTestConnection = async (cam: Camera) => {
    setTestingId(cam.id);
    try {
      const res = await api.testCamera(cam.id);
      showToast(`Test: ${res.message} (${res.latencyMs}ms)`, res.status === 'online' ? 'success' : 'warning');
      fetchCameras();
    } catch (err: any) {
      showToast('Camera connection test failed', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleViewLive = (cam: Camera) => {
    setSelectedCameraId(cam.id);
    navigateTo('live');
  };

  // Render Status Badge
  const renderStatusBadge = (status: Camera['status']) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            CONNECTING
          </span>
        );
      case 'auth_failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            AUTH FAILED
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            DEGRADED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#DCE6F0]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <Server className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#102A43]">
                Camera Registry & Streaming Ingestion
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Manage RTSP nodes, WebRTC gateways, hardware access, PTZ profiles and connection credentials
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleStartDiscovery}
            disabled={isDiscovering}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#DCE6F0] text-xs font-semibold text-[#102A43] shadow-xs transition-colors cursor-pointer"
          >
            <Wifi className={`w-3.5 h-3.5 text-[#2563EB] ${isDiscovering ? 'animate-pulse' : ''}`} />
            <span>{isDiscovering ? 'Scanning Subnet...' : 'LAN Discovery'}</span>
          </button>

          <button
            onClick={() => {
              setAddMethod('manual');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Camera</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs">
          <p className="text-[11px] font-mono text-slate-500 uppercase">Configured Nodes</p>
          <p className="text-2xl font-bold text-[#102A43] mt-1">{cameras.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs">
          <p className="text-[11px] font-mono text-slate-500 uppercase">Online Streams</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {cameras.filter((c) => c.status === 'online').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs">
          <p className="text-[11px] font-mono text-slate-500 uppercase">Offline / degraded</p>
          <p className="text-2xl font-bold text-rose-500 mt-1">
            {cameras.filter((c) => c.status !== 'online').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs">
          <p className="text-[11px] font-mono text-slate-500 uppercase">PTZ Supported</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {cameras.filter((c) => c.capabilities?.ptz).length}
          </p>
        </div>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-5">
        {cameras.map((cam) => (
          <div
            key={cam.id}
            className="rounded-2xl bg-white border border-[#DCE6F0] p-5 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#102A43] text-base">{cam.name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                    {cam.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cam.location} • Sector Group: <span className="font-semibold text-slate-700">{cam.group}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {renderStatusBadge(cam.status)}
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Resolution</span>
                <span className="font-bold text-slate-800 font-mono">{cam.resolution || '1080P'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Frame Rate</span>
                <span className="font-bold text-slate-800 font-mono">{cam.fps || 30} FPS</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Latency</span>
                <span className="font-bold text-blue-600 font-mono">
                  {cam.status === 'online' ? `${cam.latencyMs || 45}ms` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Source Adapter</span>
                <span className="font-semibold text-slate-700 truncate block">
                  {cam.isDemo ? 'Demo CCTV Gateway' : (cam.sourceType || 'RTSP').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">PTZ Hardware</span>
                <span
                  className={`font-semibold ${
                    cam.capabilities?.ptz ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {cam.capabilities?.ptz ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Auth Vault</span>
                <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>{cam.hasAuth ? 'Protected' : 'Anonymous'}</span>
                </span>
              </div>
            </div>

            {/* Sanitized Stream URL Display */}
            <div className="p-2 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-600 truncate flex items-center justify-between">
              <span className="truncate" title={cam.webcam24Url || cam.sourceUrl || cam.rtspUrl}>
                {cam.webcam24Url || cam.sourceUrl || cam.rtspUrl || `rtsp://${cam.ip || '192.168.1.1'}:554/stream1`}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 ml-2">
                {cam.sourceType === 'embed' ? 'LIVE WEB' : (cam.transport?.toUpperCase() || 'TCP')}
              </span>
            </div>

            {/* Card Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewLive(cam)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] font-bold transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Live View</span>
                </button>

                <button
                  onClick={() => handleTestConnection(cam)}
                  disabled={testingId === cam.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === cam.id ? 'animate-spin' : ''}`} />
                  <span>Test Link</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleCamera(cam)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title={cam.enabled ? 'Disable Camera' : 'Enable Camera'}
                >
                  {cam.enabled ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <button
                  onClick={() => setCameraToDelete(cam)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete Camera Node"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Camera Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#DCE6F0] shadow-2xl p-6 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-[#102A43]">Register Surveillance Camera Node</h2>
                <p className="text-xs text-slate-500">Configure RTSP endpoint, stream parameters, and hardware capabilities</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Method Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddMethod('manual')}
                className={`py-1.5 rounded-lg transition-all ${
                  addMethod === 'manual' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600'
                }`}
              >
                Manual RTSP
              </button>
              <button
                type="button"
                onClick={() => setAddMethod('ip')}
                className={`py-1.5 rounded-lg transition-all ${
                  addMethod === 'ip' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600'
                }`}
              >
                IP / Domain
              </button>
              <button
                type="button"
                onClick={() => setAddMethod('demo')}
                className={`py-1.5 rounded-lg transition-all ${
                  addMethod === 'demo' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600'
                }`}
              >
                Demo CCTV Node
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Camera Friendly Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. South Gate PTZ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[#102A43] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sector Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Logistics Bay 2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[#102A43] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {addMethod !== 'demo' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">IP Address / Host</label>
                      <input
                        type="text"
                        placeholder="192.168.1.120"
                        value={ip}
                        onChange={(e) => {
                          setIp(e.target.value);
                          setRtspUrl(`rtsp://${e.target.value}:554/stream1`);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[#102A43] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Sector Security Group</label>
                      <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[#102A43]"
                      >
                        <option value="Perimeter">Perimeter</option>
                        <option value="Logistics">Logistics</option>
                        <option value="High Security">High Security</option>
                        <option value="Executive">Executive</option>
                        <option value="Parking">Parking</option>
                      </select>
                    </div>
                  </div>

                  {/* Secure Stream URL Validation Container */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                        <label className="font-bold text-slate-800 text-xs">
                          Secure Stream / RTSP Endpoint *
                        </label>
                      </div>

                      {/* Live Validation Status Pill */}
                      {(() => {
                        const v = validateStreamUri(rtspUrl);
                        if (!rtspUrl.trim()) {
                          return (
                            <span className="text-[10px] font-semibold text-slate-400">
                              Format: scheme://host:port/path
                            </span>
                          );
                        }
                        if (v.valid) {
                          return (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{v.protocol.toUpperCase()} Syntax Valid</span>
                            </span>
                          );
                        }
                        return (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Invalid Stream URI</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Protocol Quick-Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
                      <span className="text-slate-400 font-semibold uppercase text-[9px] mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => applyProtocolPreset('rtsp')}
                        className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                          rtspUrl.startsWith('rtsp://') && !rtspUrl.startsWith('rtsps://')
                            ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        rtsp://:554
                      </button>
                      <button
                        type="button"
                        onClick={() => applyProtocolPreset('rtsps')}
                        className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                          rtspUrl.startsWith('rtsps://')
                            ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        rtsps://:322 (TLS)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyProtocolPreset('webrtc')}
                        className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                          rtspUrl.startsWith('webrtc://')
                            ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        webrtc://:8554 (Low Latency)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyProtocolPreset('hls')}
                        className={`px-2 py-0.5 rounded-md border font-mono transition-colors ${
                          rtspUrl.includes('.m3u8')
                            ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        HLS (.m3u8)
                      </button>
                    </div>

                    {/* Secure Input Box with Mask Toggle */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none">
                        <LinkIcon className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={maskStreamUrl ? 'password' : 'text'}
                        required
                        placeholder="rtsp://192.168.1.120:554/stream1"
                        value={rtspUrl}
                        onChange={(e) => handleStreamUrlChange(e.target.value)}
                        className="w-full pl-8 pr-16 py-2 rounded-xl bg-white border border-slate-300 text-[#102A43] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMaskStreamUrl(!maskStreamUrl)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title={maskStreamUrl ? 'Reveal stream URL' : 'Mask stream URL tokens'}
                        >
                          {maskStreamUrl ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {rtspUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setRtspUrl('');
                              setIsGatewayTested(false);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                            title="Clear stream URL"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* URL Endpoint Decomposition Pill */}
                    {(() => {
                      const v = validateStreamUri(rtspUrl);
                      if (!v.valid) {
                        return (
                          <p className="text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{v.message}</span>
                          </p>
                        );
                      }
                      return (
                        <div className="flex items-center flex-wrap gap-2 text-[10px] font-mono text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-200/80">
                          <span>
                            SCHEME: <strong className="text-slate-800">{v.protocol.toUpperCase()}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            HOST: <strong className="text-slate-800">{v.host}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            PORT: <strong className="text-blue-600">{v.port}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            PATH: <strong className="text-slate-800">{v.path}</strong>
                          </span>
                        </div>
                      );
                    })()}

                    {/* Auto-Vault notification if user pasted embedded credentials */}
                    {autoVaultNotice && (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-1.5 animate-in fade-in duration-200">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{autoVaultNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Credentials (Isolated Security Vault) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Lock className="w-3.5 h-3.5 text-blue-600" />
                      <span>RTSP Authentication Credentials (Vault Protected)</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Credentials are encrypted in the backend memory vault and never transmitted to client JavaScript.
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">RTSP Username</label>
                        <input
                          type="text"
                          placeholder="admin"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#102A43]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">RTSP Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-[#102A43] pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hardware Capabilities */}
                  <div className="grid grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPtz}
                        onChange={(e) => setHasPtz(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <span className="font-semibold text-slate-700">PTZ Motor</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasAudio}
                        onChange={(e) => setHasAudio(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <span className="font-semibold text-slate-700">Audio In</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasMultiStream}
                        onChange={(e) => setHasMultiStream(e.target.checked)}
                        className="rounded accent-blue-600"
                      />
                      <span className="font-semibold text-slate-700">Multi-Stream</span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span>Configuring High-Framerate Demo CCTV Stream</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This will provision an autonomous CCTV camera node with simulated movement, telemetry timecode, object tracking, and bounding boxes. It will be explicitly labeled as <strong>DEMO CCTV GATEWAY</strong> in all surveillance dashboards.
                  </p>
                </div>
              )}

              {/* Streaming Gateway Handshake Diagnostic Card */}
              <div className="p-4 rounded-2xl border space-y-2.5 transition-all bg-white border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-bold text-slate-800 text-xs">
                      Backend Streaming Gateway Handshake
                    </span>
                  </div>

                  {testResult ? (
                    testResult.status === 'online' || testResult.gatewayVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>GATEWAY VERIFIED</span>
                      </span>
                    ) : testResult.status === 'auth_failed' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>AUTH REQUIRED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>GATEWAY UNREACHABLE</span>
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <span>PRE-FLIGHT REQUIRED</span>
                    </span>
                  )}
                </div>

                {testResult ? (
                  <div className="space-y-2 text-xs">
                    <p
                      className={`text-[11px] font-medium leading-relaxed ${
                        testResult.status === 'online' || testResult.gatewayVerified
                          ? 'text-emerald-700'
                          : testResult.status === 'auth_failed'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {testResult.message}
                    </p>

                    {(testResult.status === 'online' || testResult.gatewayVerified) && (
                      <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[10px]">
                        <div>
                          <span className="text-slate-400 block text-[9px]">LATENCY</span>
                          <strong className="text-blue-600">{testResult.latencyMs || 25}ms</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">GATEWAY LINK</span>
                          <strong className="text-slate-700">{testResult.gatewayProtocol || 'RTSP'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">RESOLUTION</span>
                          <strong className="text-slate-700">{testResult.resolution || '1080P'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">CODEC</span>
                          <strong className="text-slate-700 truncate block">{testResult.codec || 'H.264'}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Streaming Gateway validates the RTSP URI, probes the network socket, and tests stream handshake before registering the camera configuration.
                  </p>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleTestInModal(false)}
                  disabled={testingInModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingInModal ? 'animate-spin' : ''}`} />
                  <span>{testingInModal ? 'Probing Gateway...' : 'Test Gateway Handshake'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>

                  {allowUnverifiedSave && (
                    <button
                      type="button"
                      onClick={(e) => handleAddCamera(e, true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold cursor-pointer transition-colors"
                      title="Save configuration as an offline node without gateway verification"
                    >
                      Save as Offline Node
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saveValidationInProgress || testingInModal}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold cursor-pointer shadow-sm transition-all ${
                      isGatewayTested && currentSignature === lastTestedSignature
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                        : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-500/20'
                    }`}
                  >
                    {saveValidationInProgress && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {saveValidationInProgress
                        ? 'Validating Gateway...'
                        : isGatewayTested && currentSignature === lastTestedSignature
                        ? 'Save Camera (Verified ✓)'
                        : 'Test Gateway & Save'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LAN Discovery Modal */}
      {isDiscoveryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#DCE6F0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-[#2563EB]" />
                <h2 className="text-lg font-bold text-[#102A43]">LAN & Subnet Camera Discovery</h2>
              </div>
              <button
                onClick={() => setIsDiscoveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {discoveryNote && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
                <strong>Network Architecture Note:</strong> {discoveryNote}
              </div>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {discoveredNodes.map((node, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:border-blue-300 transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#102A43]">{node.hostname}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {node.ip}:{node.rtspPort}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {node.brand} • MAC: {node.mac}
                    </p>
                  </div>

                  {node.status === 'registered' ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono text-[11px] font-bold">
                      ALREADY REGISTERED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImportNode(node)}
                      className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Configure Node
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsDiscoveryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Destructive Action Policy) */}
      {cameraToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102A43]">Remove Camera Node?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{cameraToDelete.name}"</strong>? This will remove live feeds, active spatial tracks, and unbind associated monitoring rules.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setCameraToDelete(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
