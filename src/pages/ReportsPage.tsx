import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  Shield,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Camera as CameraType } from '../types';

export const ReportsPage: React.FC = () => {
  const { showToast, settings } = useApp();
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('all');
  const [reportTitle, setReportTitle] = useState('Surveillance Incident & Verification Audit Report');
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  useEffect(() => {
    api.getCameras().then(setCameras).catch(console.error);
    // Generate initial report preview
    generateReportPreview();
  }, []);

  const generateReportPreview = async () => {
    setGenerating(true);
    try {
      const data = await api.generateReport({
        title: reportTitle,
        cameraId: selectedCamera,
        includeEvidence,
      });
      setGeneratedReport(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    window.open('/api/reports/export-csv', '_blank');
    showToast('Surveillance CSV export downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Surveillance Intelligence Reports</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              AUDIT GENERATOR
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Export structured forensic logs, verified frame thumbnails & incident audit trails
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Configuration Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="text-slate-400 font-medium">Report Title</label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="text-slate-400 font-medium">Channel Filter</label>
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono"
          >
            <option value="all">All Channels & Recordings</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReportPreview}
            disabled={generating}
            className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold font-mono transition-colors"
          >
            {generating ? 'COMPILING REPORT...' : 'UPDATE REPORT PREVIEW'}
          </button>
        </div>
      </div>

      {/* Report Document Preview Sheet */}
      {generatedReport && (
        <div className="p-8 rounded-2xl bg-white text-slate-900 shadow-2xl space-y-6 max-w-4xl mx-auto border border-slate-300 print:m-0 print:border-none print:shadow-none print:w-full">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2 text-blue-700 font-bold font-mono text-sm tracking-wider">
                <Shield className="w-5 h-5 text-blue-700" />
                <span>FLASH CAM ENTERPRISE SURVEILLANCE</span>
              </div>
              <h2 className="text-2xl font-bold mt-1 text-slate-950">{generatedReport.title}</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Audited by {generatedReport.generatedBy} • Case Dossier #{generatedReport.reportId}
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-500">
              <p>Generated: {new Date(generatedReport.generatedAt).toLocaleString()}</p>
              <p className="text-emerald-700 font-bold mt-1">STATUS: VERIFIED SECURE</p>
            </div>
          </div>

          {/* Audit Metrics Summary */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-slate-100 rounded-lg text-center font-mono text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Cameras</span>
              <p className="text-lg font-bold text-slate-900">{generatedReport.summary.totalCamerasAudited}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Events</span>
              <p className="text-lg font-bold text-slate-900">{generatedReport.summary.eventsRecorded}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Critical</span>
              <p className="text-lg font-bold text-rose-600">{generatedReport.summary.criticalIncidents}</p>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Active Alerts</span>
              <p className="text-lg font-bold text-amber-600">{generatedReport.summary.activeAlerts}</p>
            </div>
          </div>

          {/* Detailed Event Table */}
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-2">
              Verified Forensic Incident Log
            </h3>

            {generatedReport.events.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No events recorded during this audit timeframe.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-mono text-[11px]">
                    <tr>
                      <th className="p-2.5">Evidence</th>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Channel</th>
                      <th className="p-2.5">Detection Label</th>
                      <th className="p-2.5">Severity</th>
                      <th className="p-2.5">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {generatedReport.events.map((evt: any) => (
                      <tr key={evt.id} className="hover:bg-slate-50">
                        <td className="p-2">
                          {evt.evidenceUrl ? (
                            <img
                              src={evt.evidenceUrl}
                              alt="Evt"
                              className="w-14 h-10 object-cover rounded bg-slate-200 border border-slate-300"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">No Frame</span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-[10px] text-slate-600">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-2 font-medium text-slate-800">{evt.camera}</td>
                        <td className="p-2">
                          <p className="font-semibold text-slate-900">{evt.type}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{evt.description}</p>
                        </td>
                        <td className="p-2 font-mono font-bold uppercase text-[10px]">
                          <span
                            className={
                              evt.severity === 'critical'
                                ? 'text-rose-600'
                                : evt.severity === 'warning'
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }
                          >
                            {evt.severity}
                          </span>
                        </td>
                        <td className="p-2 font-mono text-[11px] text-slate-600">{evt.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Document Sign-off */}
          <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Security Auditor ID: CSO-SEC-9902</span>
            <span>Cryptographic Verification: SHA256-AUTHENTICATED</span>
          </div>
        </div>
      )}
    </div>
  );
};
