import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  FileText,
  Clock,
  Sparkles,
  Send,
  Tag,
  User,
  CheckCircle2,
  Download,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Investigation } from '../types';

export const InvestigationsPage: React.FC = () => {
  const { showToast, settings } = useApp();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeCase, setActiveCase] = useState<Investigation | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  // New Case form state
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newLead, setNewLead] = useState(settings.userName || 'Chief Security Officer');

  const fetchCases = async () => {
    try {
      const list = await api.getInvestigations();
      setInvestigations(list);
      if (list.length > 0) {
        setActiveCase(list[0]);
      } else {
        setActiveCase(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.addInvestigation({
        title: newTitle.trim(),
        summary: newSummary.trim() || 'Surveillance verification incident case',
        severity: newSeverity,
        leadInvestigator: newLead,
        tags: ['Incident Investigation', 'Forensic Audit'],
      });
      showToast(`Case ${created.caseNumber} opened`, 'success');
      setIsCreatingCase(false);
      setNewTitle('');
      setNewSummary('');
      await fetchCases();
      setActiveCase(created);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create case', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newNoteText.trim()) return;

    try {
      await api.addInvestigationNote(activeCase.id, newNoteText.trim(), settings.userName);
      setNewNoteText('');
      showToast('Investigator note attached', 'success');
      const updated = await api.getInvestigation(activeCase.id);
      setActiveCase(updated);
      setInvestigations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      showToast(err?.message || 'Failed to add note', 'error');
    }
  };

  const handleStatusChange = async (status: 'open' | 'in_progress' | 'closed') => {
    if (!activeCase) return;
    try {
      const updated = await api.updateInvestigation(activeCase.id, { status });
      setActiveCase(updated);
      setInvestigations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      showToast(`Case status updated to ${status.replace('_', ' ').toUpperCase()}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update case', 'error');
    }
  };

  const handleExportCaseSummary = () => {
    if (!activeCase) return;
    const reportText = `FLASH CAM FORENSIC INVESTIGATION DOSSIER
==================================================
Case Number: ${activeCase.caseNumber}
Title: ${activeCase.title}
Status: ${activeCase.status.toUpperCase()}
Severity: ${activeCase.severity.toUpperCase()}
Lead Investigator: ${activeCase.leadInvestigator}
Date Opened: ${new Date(activeCase.createdAt).toLocaleString()}
Last Updated: ${new Date(activeCase.updatedAt).toLocaleString()}

EXECUTIVE SUMMARY:
${activeCase.summary}

INVESTIGATOR AUDIT NOTES (${activeCase.notes.length}):
${activeCase.notes
  .map((n) => `[${new Date(n.createdAt).toLocaleString()} - ${n.author}]:\n${n.text}\n`)
  .join('\n')}

==================================================
FLASH CAM AI SECURE AUDIT CHAIN`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-${activeCase.caseNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Investigation dossier downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Incident Investigation Workspace</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              FORENSICS
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Evidence dossiers, incident timelines, narrative reasoning & investigator audit trails
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCase(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono tracking-wider shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>OPEN NEW INVESTIGATION</span>
        </button>
      </div>

      {/* Case Creation Modal */}
      {isCreatingCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-mono">CREATE INVESTIGATION CASE</h2>
            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Case Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Unattended Red Bag at Perimeter North"
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Incident Summary</label>
                <textarea
                  rows={3}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Enter initial details of the verification or suspicious activity..."
                  className="w-full mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Lead Officer</label>
                  <input
                    type="text"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingCase(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Workspace: Left = Case list; Right = Case dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (4 cols): Case list */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Cases ({investigations.length})
            </span>
          </div>

          {investigations.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
              <FolderOpen className="w-8 h-8 opacity-40 mx-auto mb-2 text-blue-400" />
              <p>No investigation cases opened yet.</p>
              <button
                onClick={() => setIsCreatingCase(true)}
                className="mt-3 px-3 py-1 rounded bg-blue-600 text-white font-medium"
              >
                Open First Case
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {investigations.map((inv) => {
                const isSelected = activeCase?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setActiveCase(inv)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/70 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {inv.caseNumber}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          inv.status === 'open'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : inv.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {inv.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white truncate">{inv.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{inv.summary}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/80">
                      <span>{inv.leadInvestigator}</span>
                      <span>{inv.notes.length} notes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right (8 cols): Case Dossier Details */}
        <div className="lg:col-span-8">
          {activeCase ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                      {activeCase.caseNumber}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        activeCase.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {activeCase.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{activeCase.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lead: {activeCase.leadInvestigator} • Opened {new Date(activeCase.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Status Switcher & Export */}
                <div className="flex items-center gap-2">
                  <select
                    value={activeCase.status}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                  >
                    <option value="open">OPEN</option>
                    <option value="in_progress">IN PROGRESS</option>
                    <option value="closed">CLOSED</option>
                  </select>

                  <button
                    onClick={handleExportCaseSummary}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Export Dossier"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Case Summary */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase">
                  Incident Narrative & Evidence Summary
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {activeCase.summary}
                </div>
              </div>

              {/* Investigator Notes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold font-mono text-slate-400 uppercase">
                  Investigator Notes & Audit Log ({activeCase.notes.length})
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeCase.notes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No notes logged on this case yet.</p>
                  ) : (
                    activeCase.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className="font-semibold text-blue-400">{note.author}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add note input */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Attach investigator note to this case file..."
                    className="flex-1 px-3 py-2 text-xs text-white bg-slate-950 border border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
              <ShieldAlert className="w-12 h-12 opacity-30 mx-auto mb-2 text-blue-400" />
              <p className="text-sm font-semibold text-slate-300">Select or open a case to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
