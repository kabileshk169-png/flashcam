import React from 'react';

/**
 * Realistic CCTV camera thumbnails matching the FLASH CAM reference design:
 * - CAM-01: Perimeter Entrance North with red car and AI bounding box
 * - CAM-02: Logistics Bay 4 with trucks and warehouse loading docks
 * - CAM-03: Level B2 Data Center with blue server racks and corridor
 * - CAM-04: Zone E Outer Gate parking lot with rows of cars
 */

export const CAMERA_THUMBNAILS: Record<string, string> = {
  'cam-01': 'https://cdn.webcamera24.com/static/image/camera/detail/sturgis-motorcycle-rally-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
  'cam-02': 'https://cdn.webcamera24.com/static/image/camera/detail/lasvegas-bridge-street-cam-webcamtaxi/thumbnail/968x545/usa-new-mexico-las-vegas.webp',
  'cam-03': 'https://cdn.webcamera24.com/static/image/camera/detail/bandai-bridge-cam-webcamtaxi/thumbnail/968x545/japan-niigata-bandai-bridge.webp',
  'cam-04': 'https://cdn.webcamera24.com/static/image/camera/detail/nantucket-lower-main-street-cam-webcamtaxi/thumbnail/968x545/england-devon-exmouth-marina.webp',
  'cam-05': 'https://cdn.webcamera24.com/static/image/camera/detail/philadelphia-triangle-square-cam-webcamtaxi/thumbnail/968x545/usa-kensington-philadelphia-triangle-square.webp',
  'cam-06': 'https://cdn.webcamera24.com/static/image/camera/detail/4464-klin-ceh-uastreaming/thumbnail/968x545/4464_1692113736_rzkxizhhlxfihwisawnlpapojteaxifdomyrsexv.webp',
  'cam-07': 'https://cdn.webcamera24.com/static/image/camera/detail/muscatine-merrill-hotel-railcam-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
  'cam-08': 'https://cdn.webcamera24.com/static/image/camera/detail/ritz-livecam-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
  'cam-09': 'https://cdn.webcamera24.com/static/image/camera/detail/fort-lauderdale-beach-bar-interior-youtube/thumbnail/968x545/fort-lauderdale-beach-bar-interior.webp',
  'cam-10': 'https://cdn.webcamera24.com/static/image/camera/detail/sydney-harbour-cam-webcamtaxi/thumbnail/968x545/australia-new-south-wales-sydney-harbour.webp',
  'cam-11': 'https://cdn.webcamera24.com/static/image/camera/detail/shantikunj-gayatri-pariwar-haridwar-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
  'cam-12': 'https://cdn.webcamera24.com/static/image/camera/detail/elboroom-bar-band-cam-webcamtaxi/thumbnail/968x545/usa-florida-elbo-room-bar.webp',
  'cam-13': 'https://cdn.webcamera24.com/static/image/camera/detail/avenida-brasil-livecam-webcamtaxi/thumbnail/968x545/brazil-santa-catarina-avenida-brasil.webp',
  'cam-14': 'https://cdn.webcamera24.com/static/image/camera/detail/times-square-ball-webcamtaxi/thumbnail/968x545/usa-new-york-times-square-ball.webp',
  'cam-15': 'https://cdn.webcamera24.com/static/image/camera/detail/church-street-burlington-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
  'cam-16': 'https://cdn.webcamera24.com/static/image/camera/detail/castelldefels-beach-webcamtaxi/thumbnail/968x545/maxresdefault.webp',
};

export const CctvThumbnail: React.FC<{ cameraId: string; thumbnailUrl?: string; alt?: string }> = ({
  cameraId,
  thumbnailUrl,
  alt,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const src = thumbnailUrl || CAMERA_THUMBNAILS[cameraId];

  if (src && !imageError) {
    return (
      <div className="relative w-full h-full bg-[#0a1525] overflow-hidden">
        <img
          src={src}
          alt={alt || cameraId}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>
    );
  }

  if (cameraId === 'cam-01') {
    return (
      <div className="relative w-full h-full bg-[#1e293b] overflow-hidden">
        {/* Background Street and Gate Environment */}
        <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="60%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="road1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Sky and Foliage */}
          <rect width="400" height="120" fill="url(#sky1)" />
          {/* Trees / Foliage in background */}
          <circle cx="50" cy="70" r="45" fill="#3f6212" opacity="0.8" />
          <circle cx="110" cy="65" r="50" fill="#4d7c0f" opacity="0.85" />
          <circle cx="290" cy="60" r="48" fill="#3f6212" opacity="0.8" />
          <circle cx="360" cy="70" r="55" fill="#4d7c0f" opacity="0.85" />

          {/* Gate Stone Pillars */}
          <rect x="70" y="50" width="35" height="140" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="65" y="42" width="45" height="12" fill="#cbd5e1" />
          <rect x="295" y="50" width="35" height="140" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          <rect x="290" y="42" width="45" height="12" fill="#cbd5e1" />

          {/* Wrought Iron Gate Wings (Open) */}
          <path d="M 70 60 L 20 70 M 70 90 L 20 100 M 70 120 L 20 130 M 70 150 L 20 160" stroke="#1e293b" strokeWidth="2.5" />
          <path d="M 330 60 L 380 70 M 330 90 L 380 100 M 330 120 L 380 130 M 330 150 L 380 160" stroke="#1e293b" strokeWidth="2.5" />

          {/* Road / Driveway */}
          <path d="M 0 170 L 105 110 L 295 110 L 400 170 L 400 225 L 0 225 Z" fill="url(#road1)" />

          {/* Red Car in Gate (Matching reference screenshot exactly) */}
          <g transform="translate(145, 95)">
            {/* Shadow */}
            <ellipse cx="55" cy="85" rx="52" ry="12" fill="#0f172a" opacity="0.6" />
            {/* Car Body (Red Metallic) */}
            <path
              d="M 12 55 Q 18 35 30 30 L 78 30 Q 90 35 98 55 L 105 65 Q 106 78 98 82 L 12 82 Q 4 78 5 65 Z"
              fill="#dc2626"
            />
            {/* Roof / Cabin */}
            <path d="M 28 32 L 38 12 L 72 12 L 82 32 Z" fill="#991b1b" />
            {/* Windshield */}
            <path d="M 32 30 L 40 15 L 70 15 L 78 30 Z" fill="#0f172a" />
            {/* Grille and Headlights */}
            <rect x="35" y="62" width="40" height="14" rx="2" fill="#0f172a" />
            <ellipse cx="20" cy="58" rx="8" ry="5" fill="#fef08a" />
            <ellipse cx="90" cy="58" rx="8" ry="5" fill="#fef08a" />
            {/* Front License Plate */}
            <rect x="42" y="70" width="26" height="7" rx="1" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.5" />
            {/* Wheels */}
            <ellipse cx="18" cy="80" rx="9" ry="8" fill="#1e293b" />
            <ellipse cx="92" cy="80" rx="9" ry="8" fill="#1e293b" />
          </g>

          {/* AI Green Object Detection Bounding Box (Exact match to reference) */}
          <g transform="translate(135, 90)">
            <rect
              x="0"
              y="0"
              width="130"
              height="100"
              fill="rgba(16, 185, 129, 0.08)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
            {/* Corner Markers */}
            <path d="M 0 15 L 0 0 L 15 0" fill="none" stroke="#10b981" strokeWidth="4" />
            <path d="M 115 0 L 130 0 L 130 15" fill="none" stroke="#10b981" strokeWidth="4" />
            <path d="M 0 85 L 0 100 L 15 100" fill="none" stroke="#10b981" strokeWidth="4" />
            <path d="M 115 100 L 130 100 L 130 85" fill="none" stroke="#10b981" strokeWidth="4" />

            {/* AI Label Pill */}
            <rect x="2" y="-18" width="85" height="16" rx="2" fill="#10b981" />
            <text x="6" y="-6" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace">
              RED CAR 98%
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (cameraId === 'cam-02') {
    return (
      <div className="relative w-full h-full bg-[#0f172a] overflow-hidden">
        {/* Logistics Bay with Delivery Trucks */}
        <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
          {/* Warehouse Interior Background */}
          <rect width="400" height="225" fill="#334155" />
          {/* Ceiling structure and beams */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeWidth="3" />
          <line x1="0" y1="60" x2="400" y2="60" stroke="#1e293b" strokeWidth="2" />
          <line x1="80" y1="0" x2="80" y2="100" stroke="#1e293b" strokeWidth="2" />
          <line x1="200" y1="0" x2="200" y2="100" stroke="#1e293b" strokeWidth="2" />
          <line x1="320" y1="0" x2="320" y2="100" stroke="#1e293b" strokeWidth="2" />

          {/* Industrial Overhead Lights */}
          <circle cx="100" cy="35" r="5" fill="#fef08a" opacity="0.9" />
          <circle cx="220" cy="35" r="5" fill="#fef08a" opacity="0.9" />
          <circle cx="340" cy="35" r="5" fill="#fef08a" opacity="0.9" />

          {/* Concrete Floor with Yellow Guide Lines */}
          <polygon points="0,120 400,120 400,225 0,225" fill="#64748b" />
          <line x1="120" y1="120" x2="60" y2="225" stroke="#eab308" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="260" y1="120" x2="240" y2="225" stroke="#eab308" strokeWidth="2" strokeDasharray="6 4" />

          {/* Delivery Van 1 (White) */}
          <g transform="translate(45, 95)">
            <rect x="0" y="10" width="75" height="50" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <rect x="55" y="20" width="30" height="40" rx="2" fill="#f1f5f9" />
            <rect x="65" y="25" width="16" height="15" fill="#38bdf8" />
            <circle cx="20" cy="62" r="8" fill="#0f172a" />
            <circle cx="70" cy="62" r="8" fill="#0f172a" />
          </g>

          {/* Large Freight Truck (Blue / Silver - matching reference) */}
          <g transform="translate(190, 80)">
            {/* Cargo Box Trailer */}
            <rect x="0" y="0" width="120" height="65" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <line x1="60" y1="0" x2="60" y2="65" stroke="#94a3b8" strokeWidth="1" />
            {/* Blue Tractor Cab */}
            <path d="M 120 20 L 155 20 L 165 40 L 165 65 L 120 65 Z" fill="#2563eb" />
            {/* Windshield */}
            <path d="M 125 24 L 150 24 L 158 38 L 125 38 Z" fill="#38bdf8" />
            {/* Grille */}
            <rect x="155" y="45" width="8" height="15" fill="#0f172a" />
            {/* Wheels */}
            <circle cx="25" cy="70" r="10" fill="#0f172a" />
            <circle cx="50" cy="70" r="10" fill="#0f172a" />
            <circle cx="100" cy="70" r="10" fill="#0f172a" />
            <circle cx="145" cy="70" r="10" fill="#0f172a" />
          </g>
        </svg>
      </div>
    );
  }

  if (cameraId === 'cam-03') {
    return (
      <div className="relative w-full h-full bg-[#050b14] overflow-hidden">
        {/* Data Center Server Vault Corridor with blue LED server racks */}
        <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
          <rect width="400" height="225" fill="#040914" />
          {/* Vanishing Point Perspective Corridor */}
          {/* Ceiling grid */}
          <polygon points="0,0 400,0 230,85 170,85" fill="#0a1224" />
          <line x1="200" y1="0" x2="200" y2="85" stroke="#1e293b" strokeWidth="1.5" />
          <line x1="100" y1="0" x2="185" y2="85" stroke="#1e293b" strokeWidth="1" />
          <line x1="300" y1="0" x2="215" y2="85" stroke="#1e293b" strokeWidth="1" />

          {/* Floor grid */}
          <polygon points="0,225 400,225 230,140 170,140" fill="#091428" />
          <line x1="200" y1="225" x2="200" y2="140" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
          <line x1="120" y1="225" x2="185" y2="140" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />
          <line x1="280" y1="225" x2="215" y2="140" stroke="#0ea5e9" strokeWidth="1" opacity="0.4" />

          {/* Left Server Racks with Cyan/Blue LEDs */}
          <polygon points="0,0 170,85 170,140 0,225" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1.5" />
          {/* Racks vertical partitions */}
          {[20, 50, 85, 125].map((x, i) => (
            <line key={`lr-${i}`} x1={x} y1={x * 0.5} x2={x} y2={225 - x * 0.5} stroke="#1e40af" strokeWidth="1.5" />
          ))}
          {/* Blinking Blue/Cyan LED matrix */}
          {[30, 45, 65, 80, 100, 120, 140].map((y, idx) => (
            <g key={`led-l-${idx}`}>
              <circle cx="35" cy={y} r="1.5" fill="#38bdf8" />
              <circle cx="70" cy={y + 10} r="1.5" fill="#06b6d4" />
              <circle cx="110" cy={y + 5} r="1.5" fill="#3b82f6" />
              <circle cx="140" cy={y + 12} r="1.5" fill="#10b981" />
            </g>
          ))}

          {/* Right Server Racks with Cyan/Blue LEDs */}
          <polygon points="400,0 230,85 230,140 400,225" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1.5" />
          {[380, 350, 315, 275].map((x, i) => (
            <line key={`rr-${i}`} x1={x} y1={(400 - x) * 0.5} x2={x} y2={225 - (400 - x) * 0.5} stroke="#1e40af" strokeWidth="1.5" />
          ))}
          {[30, 45, 65, 80, 100, 120, 140].map((y, idx) => (
            <g key={`led-r-${idx}`}>
              <circle cx="365" cy={y} r="1.5" fill="#38bdf8" />
              <circle cx="330" cy={y + 8} r="1.5" fill="#06b6d4" />
              <circle cx="290" cy={y + 14} r="1.5" fill="#3b82f6" />
              <circle cx="260" cy={y + 5} r="1.5" fill="#10b981" />
            </g>
          ))}

          {/* End of corridor secure portal */}
          <rect x="175" y="90" width="50" height="50" fill="#020617" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="200" cy="115" r="3" fill="#10b981" />
        </svg>
      </div>
    );
  }

  // CAM-04: Zone E Outer Gate Parking Lot with rows of cars
  return (
    <div className="relative w-full h-full bg-[#1e293b] overflow-hidden">
      <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
        {/* Asphalt Ground */}
        <rect width="400" height="225" fill="#334155" />
        {/* Background Fence & Sky */}
        <rect x="0" y="0" width="400" height="60" fill="#64748b" />
        <line x1="0" y1="58" x2="400" y2="58" stroke="#94a3b8" strokeWidth="2" />
        {/* Distant trees */}
        <circle cx="60" cy="40" r="25" fill="#1e3a5f" opacity="0.6" />
        <circle cx="160" cy="38" r="30" fill="#1e3a5f" opacity="0.6" />
        <circle cx="280" cy="42" r="25" fill="#1e3a5f" opacity="0.6" />

        {/* Parking Lot White Lines */}
        {[80, 140, 200, 260, 320].map((x) => (
          <line key={`p1-${x}`} x1={x} y1="70" x2={x - 20} y2="130" stroke="#f8fafc" strokeWidth="2" opacity="0.8" />
        ))}
        {[70, 130, 190, 250, 310].map((x) => (
          <line key={`p2-${x}`} x1={x - 20} y1="140" x2={x - 45} y2="215" stroke="#f8fafc" strokeWidth="2" opacity="0.8" />
        ))}

        {/* Row 1 Parked Cars */}
        <g transform="translate(85, 75)">
          {/* Silver SUV */}
          <rect x="0" y="0" width="45" height="28" rx="3" fill="#cbd5e1" />
          <rect x="8" y="4" width="28" height="14" rx="2" fill="#0f172a" />
        </g>
        <g transform="translate(145, 75)">
          {/* Black Sedan */}
          <rect x="0" y="0" width="45" height="26" rx="3" fill="#0f172a" />
          <rect x="8" y="4" width="28" height="12" rx="2" fill="#334155" />
        </g>
        <g transform="translate(205, 75)">
          {/* White Hatchback */}
          <rect x="0" y="0" width="42" height="26" rx="3" fill="#f8fafc" />
          <rect x="8" y="4" width="26" height="12" rx="2" fill="#0f172a" />
        </g>

        {/* Foreground Row 2 Parked Cars (prominent in screenshot) */}
        <g transform="translate(45, 145)">
          {/* White SUV foreground */}
          <rect x="0" y="0" width="65" height="38" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="12" y="6" width="40" height="18" rx="2" fill="#0f172a" />
          <ellipse cx="14" cy="38" rx="7" ry="5" fill="#0f172a" />
          <ellipse cx="50" cy="38" rx="7" ry="5" fill="#0f172a" />
        </g>
        <g transform="translate(130, 145)">
          {/* Dark Gray SUV foreground */}
          <rect x="0" y="0" width="65" height="38" rx="4" fill="#475569" />
          <rect x="12" y="6" width="40" height="18" rx="2" fill="#0f172a" />
          <ellipse cx="14" cy="38" rx="7" ry="5" fill="#0f172a" />
          <ellipse cx="50" cy="38" rx="7" ry="5" fill="#0f172a" />
        </g>
        <g transform="translate(215, 145)">
          {/* Silver Sedan foreground */}
          <rect x="0" y="0" width="62" height="36" rx="4" fill="#94a3b8" />
          <rect x="12" y="6" width="38" height="16" rx="2" fill="#0f172a" />
          <ellipse cx="14" cy="36" rx="7" ry="5" fill="#0f172a" />
          <ellipse cx="48" cy="36" rx="7" ry="5" fill="#0f172a" />
        </g>
      </svg>
    </div>
  );
};
