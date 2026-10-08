import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Eye,
  Camera,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { SecurityEvent, SecurityAlert, MonitoringRule, Camera as CameraType } from '../types';

export const EventsAlertsPage: React.FC = () => {
  const { showToast, refreshMetrics, navigateTo, setSelectedVideoId, setSeekTargetSeconds } = useApp();

  const [activeTab, setActiveTab] = useState<'alerts' | 'events' | 'rules'>('alerts');
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [rules, setRules] = useState<MonitoringRule[]>([]);
  const [cameras, setCameras] = useState<CameraType[]>([]);

  // Filter
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // New Rule form
  const [newRuleName, setNewRuleName] = useState('');
  const [newTargetObject, setNewTargetObject] = useState('');
  const [newRuleCamera, setNewRuleCamera] = useState('all');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'critical' | 'warning' | 'info'>('warning');

  const fetchData = async () => {
    try {
      const [alts, evts, rls, cams] = await Promise.all([
        api.getAlerts(),
        api.getEvents(),
        api.getRules(),
        api.getCameras(),
      ]);
      setAlerts(alts);
      setEvents(evts);
      setRules(rls);
      setCameras(cams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id, 'Duty Officer');
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'acknowledged' } : a))
      );
      showToast('Alert acknowledged', 'success');
      refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Failed to acknowledge alert', 'error');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.dismissAlert(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' } : a)));
      showToast('Alert dismissed', 'info');
      refreshMetrics();
    } catch (err: any) {
      showToast(err?.message || 'Failed to dismiss alert', 'error');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newTargetObject.trim()) return;

    try {
      const cam = cameras.find((c) => c.id === newRuleCamera);
      await api.addRule({
        name: newRuleName.trim(),
        targetObject: newTargetObject.trim(),
        cameraId: newRuleCamera,
        cameraName: cam ? cam.name : 'All Cameras',
        severity: newRuleSeverity,
        action: 'create_alert',
      });
      showToast(`Monitoring rule "${newRuleName}" created`, 'success');
      setIsRuleModalOpen(false);
      setNewRuleName('');
      setNewTargetObject('');
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create rule', 'error');
    }
  };

  const handleToggleRule = async (rule: MonitoringRule) => {
    try {
      const updated = await api.updateRule(rule.id, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
      showToast(`Rule ${updated.enabled ? 'activated' : 'paused'}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle rule', 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this monitoring rule?')) return;
    try {
      await api.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast('Rule deleted', 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete rule', 'error');
    }
  };

  const handleOpenEventEvidence = (evt: SecurityEvent) => {
    if (evt.videoId) {
      setSelectedVideoId(evt.videoId);
      if (evt.videoTimestamp !== undefined) {
        setSeekTargetSeconds(evt.videoTimestamp);
      }
      navigateTo('video-verification');
    } else if (evt.cameraId) {
      navigateTo('live');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const filteredEvents = events.filter((e) => {
    if (severityFilter === 'all') return true;
    return e.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Threat Events & Monitoring Rules</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              ALERT ENGINE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time incident dispatching, rule triggers, acknowledgment queues & audit logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'rules' && (
            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono tracking-wider shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>NEW RULE</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs & Severity Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'alerts'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ACTIVE ALERTS ({alerts.filter((a) => a.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL EVENTS ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MONITORING RULES ({rules.length})
          </button>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-mono">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
      </div>

      {/* Tab 1: Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
              <CheckCircle2 className="w-10 h-10 opacity-30 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">No active security alerts</p>
              <p className="text-xs text-slate-500 mt-1">Surveillance perimeter is normal.</p>
            </div>
          ) : (
            filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        alt.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-sm font-bold text-white">{alt.ruleName || 'Incident Alert'}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        alt.status === 'active'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alt.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{alt.message}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Channel: {alt.cameraName || 'Surveillance Feed'} • {new Date(alt.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alt.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleAcknowledge(alt.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleDismiss(alt.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {alt.status === 'acknowledged' && (
                    <span className="text-xs text-emerald-400 font-mono">Acknowledged</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: All Events */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
              <p className="text-sm font-semibold text-slate-300">No events found</p>
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  {evt.evidenceFrameUrl ? (
                    <img
                      src={evt.evidenceFrameUrl}
                      alt="Thumbnail"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                      className="w-16 h-12 object-cover rounded bg-slate-950 border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-12 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5 text-slate-600" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{evt.type}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                          evt.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {evt.severity}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {evt.confidence}% CONF
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5">{evt.description}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">
                      {evt.cameraName || evt.videoTitle || 'Channel'} • {new Date(evt.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEventEvidence(evt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Evidence</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Monitoring Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      rule.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {rule.severity}
                  </span>

                  <button
                    onClick={() => handleToggleRule(rule)}
                    className="text-slate-400 hover:text-white"
                    title={rule.enabled ? 'Pause Rule' : 'Activate Rule'}
                  >
                    {rule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                  <div className="mt-2 text-xs space-y-1 font-mono text-slate-400">
                    <p>
                      <span className="text-slate-500">IF: </span>
                      <strong className="text-blue-300">"{rule.targetObject}"</strong> detected
                    </p>
                    <p>
                      <span className="text-slate-500">ON: </span>
                      {rule.cameraName || 'All Channels'}
                    </p>
                    <p>
                      <span className="text-slate-500">THEN: </span>
                      <strong className="text-rose-400">TRIGGER DISPATCH ALERT</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Triggers: {rule.triggerCount}</span>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Monitoring Rule */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-mono">NEW SURVEILLANCE RULE</h2>
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Red Bag Abandoned Alert"
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Target Object / Keyword</label>
                <input
                  type="text"
                  required
                  value={newTargetObject}
                  onChange={(e) => setNewTargetObject(e.target.value)}
                  placeholder="e.g. red bag, unauthorized person, weapon"
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Target Camera Channel</label>
                <select
                  value={newRuleCamera}
                  onChange={(e) => setNewRuleCamera(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                >
                  <option value="all">All Cameras & Feeds</option>
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Severity</label>
                <select
                  value={newRuleSeverity}
                  onChange={(e) => setNewRuleSeverity(e.target.value as any)}
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
