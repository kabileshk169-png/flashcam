/**
 * Simulated Surveillance Camera Feed Generator
 * Generates an active CCTV MediaStream via HTML5 Canvas captureStream
 * when physical hardware camera is unavailable or not found.
 */

export interface SimulatorHandle {
  stream: MediaStream | null;
  stop: () => void;
}

export function startSimulatedCCTV(
  canvas: HTMLCanvasElement,
  cameraName: string = 'Main Gate (Cam 01)'
): SimulatorHandle {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { stream: null, stop: () => {} };
  }

  canvas.width = 640;
  canvas.height = 360;

  let animFrameId: number;
  let vehicleX = 80;
  let vehicleDir = 1;
  let personX = 460;
  let personDir = -1;

  const draw = () => {
    // 1. Dark asphalt / compound background
    ctx.fillStyle = '#080e1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Concrete floor & perimeter walls
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 180, canvas.width, 180);

    // Grid lines / pavement markings
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 180);
      ctx.lineTo(x - 50, canvas.height);
      ctx.stroke();
    }

    // Yellow warning perimeter line
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(canvas.width, 240);
    ctx.stroke();

    // Security Gate structure
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 110, 130, 70);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SECTOR ENTRANCE', 50, 135);

    // Stationary unattended red bag on perimeter bench (for monitoring rule verification)
    ctx.fillStyle = '#334155';
    ctx.fillRect(300, 230, 45, 6); // Bench
    ctx.fillStyle = '#ef4444'; // Red Bag
    ctx.fillRect(312, 214, 18, 16);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(316, 210, 10, 4); // Handle
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('BAG', 315, 225);

    // Animated White Vehicle / Van
    vehicleX += vehicleDir * 0.7;
    if (vehicleX > 400) vehicleDir = -1;
    if (vehicleX < 70) vehicleDir = 1;

    ctx.fillStyle = '#f1f5f9'; // White vehicle body
    ctx.fillRect(vehicleX, 195, 110, 45);
    ctx.fillStyle = '#38bdf8'; // Windshield
    ctx.fillRect(vehicleDir > 0 ? vehicleX + 75 : vehicleX + 10, 200, 25, 20);
    ctx.fillStyle = '#0f172a'; // Wheels
    ctx.beginPath();
    ctx.arc(vehicleX + 25, 243, 9, 0, Math.PI * 2);
    ctx.arc(vehicleX + 85, 243, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444'; // Rear light
    ctx.fillRect(vehicleDir > 0 ? vehicleX : vehicleX + 105, 210, 5, 10);

    // Animated Person walking
    personX += personDir * 0.5;
    if (personX < 190) personDir = 1;
    if (personX > 540) personDir = -1;

    // Head
    ctx.fillStyle = '#fcd34d';
    ctx.beginPath();
    ctx.arc(personX, 150, 8, 0, Math.PI * 2);
    ctx.fill();

    // Body (dark jacket)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(personX - 7, 158, 14, 25);

    // Legs
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    const legSwing = Math.sin(Date.now() / 200) * 5;
    ctx.beginPath();
    ctx.moveTo(personX - 3, 183);
    ctx.lineTo(personX - 5 + legSwing, 205);
    ctx.moveTo(personX + 3, 183);
    ctx.lineTo(personX + 5 - legSwing, 205);
    ctx.stroke();

    // Red Backpack on Person
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(personX + (personDir > 0 ? -13 : 7), 161, 10, 16);

    // CCTV Reticle & Crosshairs
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 12, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 12, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, canvas.height / 2 - 12);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 + 12);
    ctx.stroke();

    // Live On-Screen Display (OSD) Timestamps
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${cameraName.toUpperCase()} • REC [LIVE]`, 25, 35);
    ctx.fillText(`${timeStr} UTC`, 25, 50);
    ctx.fillText('CCTV-GRID FEED • 1080P 30FPS', 25, canvas.height - 25);

    // Blinking red recording dot
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(canvas.width - 30, 32, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    animFrameId = requestAnimationFrame(draw);
  };

  draw();

  let stream: MediaStream | null = null;
  if (typeof (canvas as any).captureStream === 'function') {
    stream = (canvas as any).captureStream(25);
  }

  return {
    stream,
    stop: () => {
      cancelAnimationFrame(animFrameId);
    },
  };
}
