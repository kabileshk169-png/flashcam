import React from 'react';
import { Flame, Activity, Zap } from 'lucide-react';

export interface Hotspot {
  id: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  radiusPercent: number; // spread radius
  intensity: number; // 0 to 100
  label: string;
  eventCount: number;
}

export interface CameraHeatmapData {
  cameraId: string;
  activityScore: number; // 0 to 100
  transitsLastHour: number;
  peakZone: string;
  hotspots: Hotspot[];
}

// Preset realistic 1-hour accumulated motion profiles for surveillance nodes
export const CAMERA_HEATMAP_PROFILES: Record<string, CameraHeatmapData> = {
  'cam-01': {
    cameraId: 'cam-01',
    activityScore: 92,
    transitsLastHour: 54,
    peakZone: 'Main Access Turnstile',
    hotspots: [
      {
        id: 'hs-01',
        xPercent: 48,
        yPercent: 62,
        radiusPercent: 32,
        intensity: 95,
        label: 'Turnstile Chokepoint',
        eventCount: 38,
      },
      {
        id: 'hs-02',
        xPercent: 78,
        yPercent: 70,
        radiusPercent: 24,
        intensity: 70,
        label: 'Pedestrian Walkway',
        eventCount: 16,
      },
    ],
  },
  'cam-02': {
    cameraId: 'cam-02',
    activityScore: 78,
    transitsLastHour: 32,
    peakZone: 'Loading Dock Bay 4 Door',
    hotspots: [
      {
        id: 'hs-03',
        xPercent: 35,
        yPercent: 55,
        radiusPercent: 28,
        intensity: 85,
        label: 'Forklift Transit Lane',
        eventCount: 22,
      },
      {
        id: 'hs-04',
        xPercent: 65,
        yPercent: 48,
        radiusPercent: 22,
        intensity: 60,
        label: 'Pallet Staging Buffer',
        eventCount: 10,
      },
    ],
  },
  'cam-03': {
    cameraId: 'cam-03',
    activityScore: 45,
    transitsLastHour: 14,
    peakZone: 'Data Center B2 Access Door',
    hotspots: [
      {
        id: 'hs-05',
        xPercent: 52,
        yPercent: 50,
        radiusPercent: 20,
        intensity: 65,
        label: 'Biometric Scanner Portal',
        eventCount: 14,
      },
    ],
  },
  'cam-04': {
    cameraId: 'cam-04',
    activityScore: 22,
    transitsLastHour: 6,
    peakZone: 'Perimeter Barrier North',
    hotspots: [
      {
        id: 'hs-06',
        xPercent: 70,
        yPercent: 68,
        radiusPercent: 25,
        intensity: 35,
        label: 'Outer Gate Approach',
        eventCount: 6,
      },
    ],
  },
};

export const MotionHeatmapOverlay: React.FC<{
  cameraId: string;
  intensityMode?: 'thermal' | 'trajectory' | 'density';
  showLabels?: boolean;
}> = ({ cameraId, intensityMode = 'thermal', showLabels = true }) => {
  const data = CAMERA_HEATMAP_PROFILES[cameraId] || {
    cameraId,
    activityScore: 50,
    transitsLastHour: 18,
    peakZone: 'Monitored Focal Zone',
    hotspots: [
      {
        id: 'default-hs',
        xPercent: 50,
        yPercent: 55,
        radiusPercent: 25,
        intensity: 75,
        label: 'Primary Activity Zone',
        eventCount: 18,
      },
    ],
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {/* 1. Thermal Infrared Heatmap Multi-radial Layer */}
      <div className="absolute inset-0 opacity-80 mix-blend-screen transition-opacity duration-300">
        {data.hotspots.map((hs) => {
          const coreColor =
            hs.intensity > 80
              ? 'rgba(239, 68, 68, 0.85)' // Intense red
              : hs.intensity > 50
              ? 'rgba(249, 115, 22, 0.75)' // Amber-orange
              : 'rgba(59, 130, 246, 0.65)'; // Cool cyan-blue

          const midColor =
            hs.intensity > 80
              ? 'rgba(249, 115, 22, 0.55)'
              : hs.intensity > 50
              ? 'rgba(234, 179, 8, 0.45)'
              : 'rgba(14, 165, 233, 0.35)';

          const outerColor = 'rgba(59, 130, 246, 0.15)';

          return (
            <div
              key={hs.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
              style={{
                left: `${hs.xPercent}%`,
                top: `${hs.yPercent}%`,
                width: `${hs.radiusPercent * 2}%`,
                height: `${hs.radiusPercent * 2}%`,
                background: `radial-gradient(circle closest-side, ${coreColor} 0%, ${midColor} 45%, ${outerColor} 75%, transparent 100%)`,
                animationDuration: `${2.5 + (100 - hs.intensity) * 0.02}s`,
              }}
            />
          );
        })}
      </div>

      {/* 2. Trajectory Scanlines & Isothermal Contour Rings */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <pattern id="thermalGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(244, 63, 94, 0.2)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#thermalGrid)" />

        {/* Contour Rings around hotspots */}
        {data.hotspots.map((hs) => (
          <g key={`contour-${hs.id}`}>
            <circle
              cx={`${hs.xPercent}%`}
              cy={`${hs.yPercent}%`}
              r={`${hs.radiusPercent * 0.4}%`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <circle
              cx={`${hs.xPercent}%`}
              cy={`${hs.yPercent}%`}
              r={`${hs.radiusPercent * 0.8}%`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="0.8"
              strokeDasharray="4 2"
              opacity="0.6"
            />
          </g>
        ))}
      </svg>

      {/* 3. HUD Badges & Hotspot Pins */}
      {showLabels && (
        <div className="absolute inset-0">
          {data.hotspots.map((hs) => (
            <div
              key={`pin-${hs.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto cursor-help"
              style={{ left: `${hs.xPercent}%`, top: `${hs.yPercent}%` }}
              title={`${hs.label}: ${hs.eventCount} detected movements in last hour (${hs.intensity}% motion density)`}
            >
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/80 backdrop-blur-md border border-rose-500/60 shadow-lg text-[9px] font-mono font-bold text-rose-300">
                <Flame className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                <span>{hs.intensity}%</span>
              </div>
              <span className="text-[8px] font-mono text-white/90 bg-slate-950/80 px-1 rounded-xs mt-0.5 border border-white/10 whitespace-nowrap">
                {hs.label}
              </span>
            </div>
          ))}

          {/* Top-Right Heatmap 1H Accumulation Pill */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-rose-500/40 text-[9px] font-mono font-bold text-rose-300 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>1H MOTION: {data.activityScore}%</span>
            <span className="text-slate-400">({data.transitsLastHour} transits)</span>
          </div>
        </div>
      )}
    </div>
  );
};
