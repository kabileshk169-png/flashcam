import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Mic,
  Globe,
  Clock,
  Play,
  FileVideo,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp, LANGUAGE_OPTIONS } from '../context/AppContext';
import { api } from '../services/api';
import { Detection, SecurityEvent, SupportedLanguage } from '../types';
import { CctvThumbnail } from '../components/camera/CctvThumbnails';

export const AISearchPage: React.FC = () => {
  const {
    navigateTo,
    setSelectedVideoId,
    setSeekTargetSeconds,
    setSelectedCameraId,
    setIsVoiceModalOpen,
    currentLanguage,
    setLanguage,
  } = useApp();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [results, setResults] = useState<{
    detections: Detection[];
    events: SecurityEvent[];
    cameras: any[];
    alerts: any[];
    investigations: any[];
  }>({
    detections: [],
    events: [],
    cameras: [],
    alerts: [],
    investigations: [],
  });

  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#q=')) {
      const q = decodeURIComponent(hash.slice(3));
      if (q) {
        setQuery(q);
        executeSearch(q);
      }
    }
  }, []);

  const executeSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await api.search(q);
      setResults(data.results);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleOpenDetection = (det: Detection) => {
    if (det.videoId) {
      setSelectedVideoId(det.videoId);
      setSeekTargetSeconds(det.timestamp);
      navigateTo('video-verification');
    } else if (det.cameraId) {
      setSelectedCameraId(det.cameraId);
      navigateTo('live');
    }
  };

  const sampleQueries = [
    'Did a red car pass through the main gate?',
    'Find a person carrying a red bag',
    'Show activity near loading dock',
    'Find all vehicles after 10 PM',
    'முக்கிய வாயில் வழியாக சிவப்பு கார் சென்றதா?',
    'क्या कोई लाल कार मुख्य द्वार से गुजरी?',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#DCE6F0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#102A43]">
              AI Natural Language Surveillance Video Search
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Multimodal semantic search across indexed camera feeds, objects, and timestamped events
            </p>
          </div>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="p-6 rounded-2xl bg-white border border-[#DCE6F0] shadow-xs space-y-4">
        {/* Language selector chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1 font-mono">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Language:</span>
          </span>
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setQuery(lang.sampleQuery);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                currentLanguage === lang.code
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang.name} ({lang.native})
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g., "Did a red car pass through the main gate?", "Find person with red bag"...'
              className="w-full pl-11 pr-12 py-3.5 text-sm text-[#102A43] placeholder-slate-400 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/15 transition-all"
            />
            {/* Inline mic button */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Voice Search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2563EB] p-1 rounded-lg transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold font-mono tracking-wider shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'SEARCHING...' : 'RUN AI SEARCH'}</span>
          </button>
        </form>

        {/* Popular query chips */}
        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto pt-1">
          <span className="shrink-0 font-medium">Examples:</span>
          {sampleQueries.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(sq);
                executeSearch(sq);
              }}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] border border-slate-200 text-xs shrink-0 transition-colors"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* Results Area */}
      {hasSearched && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">
              Found <strong className="text-[#102A43]">{totalCount}</strong> verified surveillance results for "{query}"
            </span>
          </div>

          {totalCount === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-[#DCE6F0] text-slate-500">
              <Search className="w-10 h-10 opacity-30 mx-auto mb-2 text-[#2563EB]" />
              <p className="text-sm font-semibold text-[#102A43]">No matching evidence was found.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No recorded frames or events in the database match your criteria. Try another keyword or verify a recorded video.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.detections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2563EB]" />
                    <span>Matching Keyframe Detections ({results.detections.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.detections.map((det) => (
                      <div
                        key={det.id}
                        className="p-4 rounded-2xl bg-white border border-[#DCE6F0] hover:border-[#2563EB] shadow-xs hover:shadow-md space-y-3 transition-all"
                      >
                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-200">
                          {det.evidenceFrameUrl ? (
                            <img
                              src={det.evidenceFrameUrl}
                              alt={det.label}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CctvThumbnail cameraId={det.cameraId || 'cam-01'} />
                          )}

                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-mono font-bold text-white">
                            {det.timestampFormatted}
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[10px] font-mono font-bold">
                            {det.confidence}% CONF
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-bold text-[#102A43]">{det.label}</span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-bold ${
                                det.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-blue-100 text-[#2563EB]'
                              }`}
                            >
                              {det.severity}
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                            {det.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenDetection(det)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] text-xs font-semibold font-mono transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>JUMP TO EVIDENCE ({det.timestampFormatted})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
