import React, { useState } from 'react';
import {
  Sparkles,
  UserCheck,
  Car,
  ScanFace,
  CreditCard,
  Eye,
  Clock,
  Search,
  ShieldAlert,
  Play,
  Cpu,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CctvThumbnail } from '../components/camera/CctvThumbnails';

interface AiModelModule {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  description: string;
  confidence: number;
  detectionsSample: string[];
  status: 'active' | 'standby';
  color: string;
}

export const AIAnalysisPage: React.FC = () => {
  const { navigateTo } = useApp();
  const [selectedModule, setSelectedModule] = useState<string>('object');
  const [selectedOverlay, setSelectedOverlay] = useState<'boxes' | 'confidence' | 'trajectories'>('boxes');

  const modules: AiModelModule[] = [
    {
      id: 'object',
      name: 'Multi-Object Detection',
      category: 'Perimeter & Spatial',
      icon: Sparkles,
      description: 'Identifies unattended bags, backpacks, luggage, tools, and hazards in designated zones.',
      confidence: 98.4,
      detectionsSample: ['Red Backpack', 'Unattended Package', 'Security Barrier', 'Bicycle'],
      status: 'active',
      color: 'blue',
    },
    {
      id: 'person',
      name: 'Person & Pedestrian Tracking',
      category: 'Biometrics & Flow',
      icon: UserCheck,
      description: 'Tracks pedestrian transit vectors, loitering time, crowd density, and unauthorized presence.',
      confidence: 96.8,
      detectionsSample: ['Individual in Dark Jacket', '2 Pedestrians Walkway', 'Security Guard'],
      status: 'active',
      color: 'teal',
    },
    {
      id: 'vehicle',
      name: 'Vehicle & Traffic Flow Analysis',
      category: 'Logistics & Transit',
      icon: Car,
      description: 'Classifies vehicle makes, colors, speed, entry direction, and parking bay occupancy.',
      confidence: 97.9,
      detectionsSample: ['Red Metallic Sedan', 'Logistics Freight Truck', 'White Delivery Van'],
      status: 'active',
      color: 'emerald',
    },
    {
      id: 'anpr',
      name: 'License Plate Recognition (ANPR)',
      category: 'Access Control',
      icon: CreditCard,
      description: 'Automated optical character recognition of license plates at checkpoint gates.',
      confidence: 99.1,
      detectionsSample: ['PLATE: KA-01-MJ-4021', 'PLATE: MH-12-DE-9920', 'Whitelisted Fleet #04'],
      status: 'active',
      color: 'indigo',
    },
    {
      id: 'face',
      name: 'Face Attribute & Access Verification',
      category: 'Identity Security',
      icon: ScanFace,
      description: 'Optical facial landmark alignment, mask/helmet detection, and badge authorization check.',
      confidence: 94.6,
      detectionsSample: ['Authorized Personnel', 'Helmet Detected', 'Turnstile Pass Granted'],
      status: 'active',
      color: 'purple',
    },
    {
      id: 'scene',
      name: 'Scene & Contextual Understanding',
      category: 'Environment',
      icon: Eye,
      description: 'Understands lighting conditions, perimeter breach, fire/smoke cues, and open gates.',
      confidence: 95.5,
      detectionsSample: ['Gate Open After Hours', 'Normal Daylight Perimeter', 'Clear Visibility'],
      status: 'active',
      color: 'amber',
    },
    {
      id: 'temporal',
      name: 'Temporal Motion & Anomaly Trajectory',
      category: 'Behavioral AI',
      icon: Clock,
      description: 'Identifies sudden direction changes, running, prolonged dwell times, and perimeter climbing.',
      confidence: 93.2,
      detectionsSample: ['Dwell Time > 120s', 'High Velocity Transit', 'Boundary Proximity Alert'],
      status: 'active',
      color: 'rose',
    },
    {
      id: 'nl_search',
      name: 'Natural Language Semantic Search',
      category: 'LLM Multimodal',
      icon: Search,
      description: 'Searches surveillance video archives using English or regional languages.',
      confidence: 98.7,
      detectionsSample: ['"red car at main gate"', '"person with bag"', '"vehicle after 10 PM"'],
      status: 'active',
      color: 'blue',
    },
  ];

  const currentMod = modules.find((m) => m.id === selectedModule) || modules[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#DCE6F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#102A43]">
            AI Intelligence & Deep Video Analysis
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Multimodal Gemini Vision intelligence, automated neural feature extraction & spatial tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#DCE6F0] text-xs font-semibold text-emerald-600 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NEURAL PIPELINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main 8 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const isSelected = selectedModule === mod.id;

          return (
            <div
              key={mod.id}
              onClick={() => setSelectedModule(mod.id)}
              className={`cursor-pointer rounded-2xl bg-white border p-4.5 transition-all shadow-xs hover:shadow-md ${
                isSelected
                  ? 'border-[#2563EB] ring-2 ring-blue-500/15 shadow-sm'
                  : 'border-[#DCE6F0] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-xs">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {mod.confidence}% ACC
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#102A43]">{mod.name}</h3>
              <p className="text-[11px] font-semibold text-[#08A6B5] mt-0.5 uppercase tracking-wider font-mono">
                {mod.category}
              </p>
              <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">
                {mod.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Status:</span>
                <span className="text-[#2563EB] font-semibold flex items-center gap-1">
                  <span>Inspect Pipeline</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive AI Pipeline Inspection Workspace */}
      <div className="rounded-2xl bg-white border border-[#DCE6F0] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                ACTIVE INSPECTOR
              </span>
              <h2 className="text-lg font-bold text-[#102A43]">{currentMod.name} Pipeline</h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">{currentMod.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateTo('video-verification')}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Verify in Video Player</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Feed Preview with live bounding boxes */}
          <div className="lg:col-span-7">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-[#DCE6F0] shadow-md bg-black">
              <CctvThumbnail cameraId="cam-01" />

              {/* Top overlay */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>INSPECTOR: {currentMod.name.toUpperCase()}</span>
              </div>

              {/* Bottom telemetry */}
              <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur-md p-2 rounded-lg text-[10px] font-mono text-slate-300 flex items-center justify-between border border-white/10">
                <span>MODEL: GEMINI 3.8 FLASH</span>
                <span>INFERENCE: 182ms</span>
                <span className="text-emerald-400">FPS: 30.0</span>
              </div>
            </div>
          </div>

          {/* Model Attributes and Detections breakdown */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wider font-mono">
                Recent Model Detections
              </h4>
              <div className="space-y-2">
                {currentMod.detectionsSample.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">{sample}</span>
                    <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {Math.round(currentMod.confidence - idx * 1.5)}% CONF
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#2563EB] font-bold">
                <Cpu className="w-4 h-4" />
                <span>Zero Latency Edge & Cloud Verification</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                FLASH CAM processes surveillance frames through asynchronous vector quantization and Gemini Vision, allowing natural language prompts like "Find the red car" or "Alert when a person carries a bag".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
