import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Sliders,
  Volume2,
  Sparkles,
  Bell,
  Database,
  Trash2,
  Plus,
  CheckCircle2,
  Brain,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { MemoryEntry, UserSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, showToast, speakText, stopSpeaking } = useApp();

  // Local state initialized with context settings
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');
  const [newMemoryContext, setNewMemoryContext] = useState('');

  // MongoDB Atlas State
  const [mongoHealth, setMongoHealth] = useState<{
    connected: boolean;
    database: string;
    error: string | null;
    gridfsEnabled: boolean;
    collections: string[];
    storageEngine: string;
  } | null>(null);
  const [dbPassword, setDbPassword] = useState('');
  const [connectingMongo, setConnectingMongo] = useState(false);

  useEffect(() => {
    setFormData({ ...settings });
    fetchMemory();
    fetchMongoHealth();
  }, [settings]);

  const fetchMongoHealth = async () => {
    try {
      const h = await api.getMongoHealth();
      setMongoHealth(h);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPassword.trim()) return;
    setConnectingMongo(true);
    try {
      const res = await api.updateMongoConfig({ password: dbPassword.trim() });
      if (res.success) {
        showToast('Successfully connected to MongoDB Atlas and GridFS!', 'success');
        setDbPassword('');
        await fetchMongoHealth();
      } else {
        showToast(res.error || 'Connection failed', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Connection failed', 'error');
    } finally {
      setConnectingMongo(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const list = await api.getMemory();
      setMemories(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) return;

    try {
      await api.saveMemory(newMemoryKey.trim(), newMemoryValue.trim(), newMemoryContext.trim());
      showToast(`Memory mapping "${newMemoryKey}" saved`, 'success');
      setNewMemoryKey('');
      setNewMemoryValue('');
      setNewMemoryContext('');
      fetchMemory();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save memory', 'error');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      showToast('Memory mapping removed', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete memory', 'error');
    }
  };

  const handleTestVoice = () => {
    speakText('FLASH CAM voice agent online. All surveillance sectors operational.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>System & Intelligence Settings</span>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            CONFIGURATION
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Surveillance sampling parameters, Gemini models, voice agent synthesis & persistent memory
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white font-mono">
            <User className="w-4 h-4 text-blue-400" />
            <span>OPERATOR PROFILE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Operator Name</label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={formData.userEmail}
                onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium">Assigned Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* AI & Live Surveillance Sampling */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white font-mono">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI SURVEILLANCE & SAMPLING PARAMETERS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Live Frame Sampling Rate</label>
              <select
                value={formData.detectionInterval}
                onChange={(e) =>
                  setFormData({ ...formData, detectionInterval: Number(e.target.value) })
                }
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              >
                <option value={1}>1 frame / second (Ultra-Fast)</option>
                <option value={2}>1 frame / 2 seconds</option>
                <option value={3}>1 frame / 3 seconds (Balanced)</option>
                <option value={5}>1 frame / 5 seconds</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Directly drives live webcam analysis interval</p>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Confidence Filter (%)</label>
              <input
                type="number"
                min={10}
                max={99}
                value={formData.confidenceThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, confidenceThreshold: Number(e.target.value) })
                }
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Minimum detection confidence threshold</p>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Primary Vision AI Model</label>
              <select
                value={formData.aiModel}
                onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Deep reasoning)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Server-side multi-modal SDK integration</p>
            </div>
          </div>
        </div>

        {/* Voice Agent & Audio Settings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-sm font-bold text-white font-mono">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>VOICE AGENT & AUDIO SYNTHESIS</span>
            </div>
            <button
              type="button"
              onClick={handleTestVoice}
              className="text-xs text-blue-400 hover:text-blue-300 font-normal font-sans"
            >
              Test Speech Audio
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium">Speech Rate Multiplier</label>
              <select
                value={formData.voiceSpeed}
                onChange={(e) => setFormData({ ...formData, voiceSpeed: Number(e.target.value) })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
              >
                <option value={0.8}>0.8x (Deliberate)</option>
                <option value={1.0}>1.0x (Standard)</option>
                <option value={1.2}>1.2x (Fast briefing)</option>
                <option value={1.4}>1.4x (Ultra fast)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <p className="font-semibold text-white">Auto Voice Readout</p>
                <p className="text-[11px] text-slate-400">Speak AI responses automatically</p>
              </div>
              <input
                type="checkbox"
                checked={formData.autoVoiceOutput}
                onChange={(e) =>
                  setFormData({ ...formData, autoVoiceOutput: e.target.checked })
                }
                className="w-4 h-4 rounded accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </form>

      {/* Persistent AI Memory Management Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sm font-bold text-white font-mono">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span>PERSISTENT AI MEMORY & CAMERA ALIASES</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The AI Agent remembers confirmed camera mappings and security rules (e.g., "Main Gate" = cam-01). You can inspect, add, or prune persistent memories here.
        </p>

        {/* Memory list */}
        <div className="space-y-2">
          {memories.map((mem) => (
            <div
              key={mem.id}
              className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-blue-300 font-mono">"{mem.key}"</span>
                <span className="text-slate-500 mx-2">→</span>
                <span className="font-semibold text-white font-mono">{mem.value}</span>
                {mem.context && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{mem.context}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteMemory(mem.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Remove memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input
            type="text"
            required
            value={newMemoryKey}
            onChange={(e) => setNewMemoryKey(e.target.value)}
            placeholder="Key / Alias (e.g. Backdoor)"
            className="p-2 rounded bg-slate-900 border border-slate-700 text-white"
          />
          <input
            type="text"
            required
            value={newMemoryValue}
            onChange={(e) => setNewMemoryValue(e.target.value)}
            placeholder="Target Camera ID (e.g. cam-02)"
            className="p-2 rounded bg-slate-900 border border-slate-700 text-white"
          />
          <button
            type="submit"
            className="py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold font-mono"
          >
            Save Memory
          </button>
        </form>
      </div>

      {/* MongoDB Atlas & GridFS Infrastructure Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>MONGODB ATLAS & GRIDFS ENGINE</span>
          </div>
          {mongoHealth?.connected ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE & ACTIVE (GRIDFS)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              AWAITING PASSWORD AUTH
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          MongoDB Atlas is configured as the unified operational database and binary video store via <strong>MongoDB GridFS</strong>. Videos, processing jobs, tracking trajectories, and detections persist across all 10 schema collections.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block">DATABASE</span>
            <span className="font-bold text-white font-mono">{mongoHealth?.database || 'flashcam'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block">VIDEO STORAGE</span>
            <span className="font-bold text-emerald-400 font-mono">MongoDB GridFS</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block">STREAMING PROTOCOL</span>
            <span className="font-bold text-blue-400 font-mono">HTTP 206 Range</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block">INDEXED COLLECTIONS</span>
            <span className="font-bold text-indigo-400 font-mono">10 Collections</span>
          </div>
        </div>

        {/* Collections Overview */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
            Configured MongoDB Collections:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'videos',
              'processing_jobs',
              'detections',
              'tracks',
              'events',
              'evidence',
              'conversations',
              'camera_sources',
              'alerts',
              'audit_logs',
            ].map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Connect Form if not connected or to update password */}
        <form onSubmit={handleConnectMongo} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block font-mono">
            {mongoHealth?.connected ? 'Update / Refresh Atlas Password:' : 'Connect to Live MongoDB Atlas Cluster:'}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={dbPassword}
              onChange={(e) => setDbPassword(e.target.value)}
              placeholder="Enter Atlas database password for user kabileshk169_db_user"
              className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={connectingMongo || !dbPassword.trim()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition-all cursor-pointer whitespace-nowrap"
            >
              {connectingMongo ? 'Authenticating...' : 'Connect to Atlas'}
            </button>
          </div>
          {mongoHealth?.error && (
            <p className="text-[11px] text-amber-400 font-mono">
              Status: {mongoHealth.error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
