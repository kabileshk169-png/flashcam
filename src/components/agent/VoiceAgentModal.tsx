import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Command,
  Radio,
  AlertCircle,
  Play,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { useApp, LANGUAGE_OPTIONS } from '../../context/AppContext';
import { api } from '../../services/api';
import { SupportedLanguage } from '../../types';

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

const LANG_BCP47: Record<SupportedLanguage, string> = {
  EN: 'en-US',
  TA: 'ta-IN',
  HI: 'hi-IN',
  TE: 'te-IN',
  KN: 'kn-IN',
  ML: 'ml-IN',
};

export const VoiceAgentModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    navigateTo,
    setSelectedCameraId,
    setSelectedVideoId,
    setSeekTargetSeconds,
    speakText,
    stopSpeaking,
    isSpeaking,
    currentLanguage,
    setLanguage,
  } = useApp();

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastAgentReply, setLastAgentReply] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = LANG_BCP47[currentLanguage] || 'en-US';

      recognition.onstart = () => {
        setVoiceState('LISTENING');
        setErrorMessage('');
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone permission was denied. Please allow microphone in browser.');
        } else {
          setErrorMessage(`Microphone status: ${event.error}`);
        }
        setVoiceState('ERROR');
      };

      recognition.onend = () => {
        if (voiceState === 'LISTENING') {
          if (transcript.trim()) {
            handleProcessVoiceCommand(transcript.trim());
          } else {
            setVoiceState('IDLE');
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [currentLanguage]);

  useEffect(() => {
    if (!isSpeaking && voiceState === 'SPEAKING') {
      setVoiceState('IDLE');
    }
  }, [isSpeaking, voiceState]);

  if (!isVoiceModalOpen) return null;

  const startListening = () => {
    setTranscript('');
    setErrorMessage('');
    setLastAction(null);
    setLastAgentReply(null);
    stopSpeaking();

    if (!recognitionRef.current) {
      setVoiceState('ERROR');
      setErrorMessage('Speech Recognition is not available in this browser environment.');
      return;
    }

    try {
      recognitionRef.current.lang = LANG_BCP47[currentLanguage] || 'en-US';
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (transcript.trim()) {
      handleProcessVoiceCommand(transcript.trim());
    } else {
      setVoiceState('IDLE');
    }
  };

  const handleProcessVoiceCommand = async (commandText: string) => {
    setVoiceState('PROCESSING');

    const lower = commandText.toLowerCase();

    if (lower.includes('stop speaking') || lower.includes('stop audio')) {
      stopSpeaking();
      setVoiceState('IDLE');
      setLastAction('Audio speech halted.');
      return;
    }

    try {
      const res = await api.chatWithAgent(commandText, []);
      setLastAgentReply(res.reply);
      setVoiceState('SPEAKING');

      if (res.clientActions && res.clientActions.length > 0) {
        for (const act of res.clientActions) {
          if (act.action === 'navigate') {
            const p = act.payload?.path?.replace(/^\//, '') || 'overview';
            navigateTo(p as any);
            setLastAction(`Navigated to ${p}`);
          } else if (act.action === 'seek_video') {
            if (act.payload?.videoId) setSelectedVideoId(act.payload.videoId);
            if (act.payload?.timestampSeconds !== undefined) {
              setSeekTargetSeconds(act.payload.timestampSeconds);
            }
            navigateTo('video-verification');
            setLastAction(`Seeked video to ${act.payload?.timestampSeconds}s`);
          } else if (act.action === 'open_camera') {
            if (act.payload?.cameraId) setSelectedCameraId(act.payload.cameraId);
            navigateTo('live');
            setLastAction(`Opened camera ${act.payload?.cameraName}`);
          }
        }
      }

      await speakText(res.reply);
    } catch (err: any) {
      setVoiceState('ERROR');
      setErrorMessage(err?.message || 'Failed to process voice command.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white border border-[#DCE6F0] rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE6F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
              <Command className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102A43]">
                AI Voice & Multi-Language Assistant
              </h2>
              <p className="text-xs text-[#64748B]">
                Natural speech query & hands-free surveillance investigation
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopListening();
              stopSpeaking();
              setIsVoiceModalOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regional Language Tabs Selector */}
        <div className="py-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Select Speech & Query Language:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentLanguage === lang.code
                    ? 'bg-[#2563EB] text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{lang.name}</span>
                <span className="ml-1 text-[11px] opacity-75">({lang.native})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Microphone Interaction Zone */}
        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative flex items-center justify-center">
            {voiceState === 'LISTENING' && (
              <>
                <span className="absolute w-28 h-28 rounded-full bg-blue-500/20 animate-ping" />
                <span className="absolute w-36 h-36 rounded-full bg-blue-600/10 animate-pulse" />
              </>
            )}

            <button
              onClick={voiceState === 'LISTENING' ? stopListening : startListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-500 text-white shadow-rose-500/40 scale-105'
                  : voiceState === 'SPEAKING'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/40'
                  : voiceState === 'PROCESSING'
                  ? 'bg-amber-500 text-white shadow-amber-500/40'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-500/30 hover:scale-105'
              }`}
            >
              {voiceState === 'LISTENING' ? (
                <Mic className="w-8 h-8 animate-bounce text-white" />
              ) : voiceState === 'SPEAKING' ? (
                <Volume2 className="w-8 h-8 animate-pulse text-white" />
              ) : voiceState === 'PROCESSING' ? (
                <Sparkles className="w-8 h-8 animate-spin text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voiceState === 'LISTENING'
                  ? 'bg-rose-500 animate-ping'
                  : voiceState === 'SPEAKING'
                  ? 'bg-emerald-500 animate-pulse'
                  : voiceState === 'PROCESSING'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-xs font-mono font-bold tracking-wider text-[#102A43]">
              STATUS: {voiceState}
            </span>
          </div>

          <p className="text-xs text-[#64748B] mt-1 text-center max-w-sm">
            {voiceState === 'IDLE' && `Click microphone and speak in ${currentLanguage}.`}
            {voiceState === 'LISTENING' && 'Listening... Click again or stop speaking to submit.'}
            {voiceState === 'PROCESSING' && 'Reasoning query through Gemini Vision & security database...'}
            {voiceState === 'SPEAKING' && 'Synthesizing voice playback response...'}
            {voiceState === 'ERROR' && errorMessage}
          </p>
        </div>

        {/* Live Transcript & Result Box */}
        {(transcript || lastAgentReply || lastAction) && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mb-4 text-xs">
            {transcript && (
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Recognized Speech:</p>
                <p className="text-xs font-medium text-[#2563EB] mt-0.5">"{transcript}"</p>
              </div>
            )}
            {lastAction && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Action Executed: {lastAction}</span>
              </div>
            )}
            {lastAgentReply && (
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">AI Answer:</p>
                <p className="text-xs text-slate-700 leading-relaxed mt-0.5">{lastAgentReply}</p>
              </div>
            )}
          </div>
        )}

        {/* Sample queries in selected language */}
        <div>
          <p className="text-[11px] font-bold text-slate-600 mb-2 uppercase tracking-wider font-mono">
            Sample Commands ({currentLanguage}):
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              LANGUAGE_OPTIONS.find((l) => l.code === currentLanguage)?.sampleQuery ||
                'Did a red car pass through the main gate?',
              'Show the main gate.',
              'Which cameras are offline?',
              'Is there a red bag right now?',
              'Open camera three.',
              'Show latest alerts.',
              'Start monitoring the main gate for red bags.',
            ].map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(cmd);
                  handleProcessVoiceCommand(cmd);
                }}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2563EB] border border-slate-200 transition-colors"
              >
                "{cmd}"
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[10px]">Model: Gemini 3.8 Flash + Multi-Lingual STT</span>
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1 text-amber-600 font-semibold text-xs"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Mute Voice</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
