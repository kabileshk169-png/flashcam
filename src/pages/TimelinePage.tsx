import React, { useState, useEffect } from 'react';
import {
  Clock,
  Filter,
  Camera,
  Play,
  Eye,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SecurityEvent, Camera as CameraType } from '../types';

export const TimelinePage: React.FC = () => {
  const { navigateTo, setSelectedVideoId, setSeekTargetSeconds, setSelectedCameraId } = useApp();

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [selectedCameraFilter, setSelectedCameraFilter] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [zoomLevel, setZoomLevel] = useState<'hour' | 'day' | 'all'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [evts, cams] = await Promise.all([api.getEvents(), api.getCameras()]);
        setEvents(evts);
        setCameras(cams);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (selectedCameraFilter !== 'all' && e.cameraId !== selectedCameraFilter) return false;
    if (selectedSeverity !== 'all' && e.severity !== selectedSeverity) return false;
    return true;
  });

  const handleJumpToSource = (evt: SecurityEvent) => {
    if (evt.videoId) {
      setSelectedVideoId(evt.videoId);
      if (evt.videoTimestamp !== undefined) {
        setSeekTargetSeconds(evt.videoTimestamp);
      }
      navigateTo('video-verification');
    } else if (evt.cameraId) {
      setSelectedCameraId(evt.cameraId);
      navigateTo('live');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Multi-Channel Surveillance Timeline</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              CHRONOLOGY
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Synchronized temporal incident tracking across all deployed camera channels & verified videos
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedCameraFilter}
            onChange={(e) => setSelectedCameraFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
          >
            <option value="all">All Channels</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Clock className="w-10 h-10 opacity-30 mx-auto mb-2 text-blue-400" />
            <p className="text-sm font-semibold text-slate-300">No events logged on the timeline</p>
            <p className="text-xs text-slate-500 mt-1">
              Events detected on live camera or during video verification will populate here chronologically.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredEvents.map((evt) => (
              <div key={evt.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                    evt.severity === 'critical'
                      ? 'bg-rose-500'
                      : evt.severity === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                />

                {/* Card */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {evt.evidenceFrameUrl && (
                      <img
                        src={evt.evidenceFrameUrl}
                        alt={evt.type}
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                        className="w-20 h-14 object-cover rounded bg-slate-900 border border-slate-800 shrink-0"
                      />
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{evt.type}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                            evt.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {evt.severity}
                        </span>
                        <span className="text-xs font-mono text-blue-400">
                          {evt.confidence}% CONF
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{evt.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="text-slate-400 font-semibold">
                          {evt.cameraName || evt.videoTitle || 'Surveillance Channel'}
                        </span>
                        <span>•</span>
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                        {evt.videoTimestamp !== undefined && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400">Timestamp: {evt.videoTimestamp}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJumpToSource(evt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold shrink-0 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Seek to Evidence</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
