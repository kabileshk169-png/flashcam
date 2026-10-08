import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Terminal,
  ArrowRight,
  ExternalLink,
  Volume2,
  RefreshCw,
  Video,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  toolCalls?: Array<{ name: string; args: any; result: any }>;
  clientActions?: Array<{ action: string; payload: any }>;
  timestamp: string;
}

export const AIAgentDrawer: React.FC = () => {
  const {
    isAgentDrawerOpen,
    setIsAgentDrawerOpen,
    navigateTo,
    setSelectedCameraId,
    setSelectedVideoId,
    setSeekTargetSeconds,
    speakText,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      role: 'model',
      text: 'FLASH CAM Security AI Agent online. I have live tool access to indexed video frames, camera streams, alerts, investigations, and navigation. How can I assist you?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAgentDrawerOpen) {
      scrollToBottom();
    }
  }, [messages, isAgentDrawerOpen]);

  if (!isAgentDrawerOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Prepare conversation history
      const history = messages
        .filter((m) => m.id !== 'msg-init')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await api.chatWithAgent(text, history);

      const aiMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: res.reply,
        toolCalls: res.toolCallsExecuted,
        clientActions: res.clientActions,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Automatically execute client actions if returned
      if (res.clientActions && res.clientActions.length > 0) {
        for (const action of res.clientActions) {
          executeClientAction(action);
        }
      }

      // Voice output
      speakText(res.reply);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: `Error connecting to AI service: ${err?.message || 'Unknown error'}. Please verify backend status.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeClientAction = (action: { action: string; payload: any }) => {
    if (action.action === 'navigate') {
      const path = action.payload?.path?.replace(/^\//, '') || 'overview';
      navigateTo(path as any);
    } else if (action.action === 'seek_video') {
      if (action.payload?.videoId) {
        setSelectedVideoId(action.payload.videoId);
      }
      if (action.payload?.timestampSeconds !== undefined) {
        setSeekTargetSeconds(action.payload.timestampSeconds);
      }
      navigateTo('video-verification');
    } else if (action.action === 'open_camera') {
      if (action.payload?.cameraId) {
        setSelectedCameraId(action.payload.cameraId);
      }
      navigateTo('live');
    } else if (action.action === 'open_video') {
      if (action.payload?.videoId) {
        setSelectedVideoId(action.payload.videoId);
      }
      navigateTo('video-verification');
    } else if (action.action === 'highlight_evidence') {
      navigateTo('events');
    }
  };

  const samplePrompts = [
    'Show the main gate',
    'Are there any red bags right now?',
    'Which cameras are offline?',
    'Take a snapshot of Camera 01',
    'Alert me whenever a red bag appears at the main gate',
    'Start recording on Camera 01',
    'What are Camera 01 capabilities?',
    'Remember that Main Gate means cam-01',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">FLASH CAM AI</h2>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Video Intelligence Agent</p>
            </div>
          </div>
          <button
            onClick={() => setIsAgentDrawerOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-3 py-2 bg-slate-900/30 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-blue-600/20 hover:text-blue-300 text-slate-300 border border-slate-700 hover:border-blue-500/40 transition-all shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-mono">
                {msg.role === 'user' ? (
                  <span>Operator</span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Sparkles className="w-3 h-3" />
                    FLASH AI
                  </span>
                )}
                <span>• {msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-600/20'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Tool calls execution status badge if executed */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-2.5 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                      <Terminal className="w-3 h-3" />
                      <span className="font-semibold">Tools Executed:</span>
                    </div>
                    {msg.toolCalls.map((tc, i) => (
                      <div key={i} className="pl-3 border-l border-blue-500/40 my-1 space-y-0.5">
                        <span className="text-emerald-400 font-bold">{tc.name}()</span>
                        <div className="text-[10px] text-slate-500 truncate">
                          args: {JSON.stringify(tc.args)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Interactive Action Buttons */}
                {msg.clientActions && msg.clientActions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-2">
                    {msg.clientActions.map((act, i) => {
                      if (act.action === 'seek_video') {
                        return (
                          <button
                            key={i}
                            onClick={() => executeClientAction(act)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 text-xs font-semibold"
                          >
                            <Play className="w-3 h-3" />
                            <span>Seek to {act.payload?.timestampSeconds}s</span>
                          </button>
                        );
                      }
                      if (act.action === 'open_camera') {
                        return (
                          <button
                            key={i}
                            onClick={() => executeClientAction(act)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                          >
                            <Video className="w-3 h-3" />
                            <span>Open {act.payload?.cameraName || 'Camera'}</span>
                          </button>
                        );
                      }
                      if (act.action === 'navigate') {
                        return (
                          <button
                            key={i}
                            onClick={() => executeClientAction(act)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Go to {act.payload?.path}</span>
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {msg.role === 'model' && (
                <button
                  onClick={() => speakText(msg.text)}
                  title="Speak response"
                  className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 hover:text-blue-400 transition-colors px-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Audio Playback</span>
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-blue-400 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing surveillance records and reasoning...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask AI or give command (e.g. 'Find red bag')..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 bg-slate-950 border border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500 font-sans"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
