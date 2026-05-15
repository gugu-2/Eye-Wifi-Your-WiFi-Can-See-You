import './style.css';

// -----------------------------------------------------------------------------
// THEME TOGGLE
// -----------------------------------------------------------------------------
const themeBtn = document.getElementById('theme-toggle');
const iconSun = document.querySelector('.icon-sun');
const iconMoon = document.querySelector('.icon-moon');
let currentTheme = 'dark';

const THEME_COLORS = {
  dark: { textMain: '#e2e8f0', textMuted: '#8b98a5', primary: '#5c85ff', success: '#34d399', gridLine: 'rgba(255,255,255,0.05)', particle: 'rgba(255,255,255,0.08)' },
  light: { textMain: '#0f172a', textMuted: '#64748b', primary: '#2563eb', success: '#10b981', gridLine: 'rgba(0,0,0,0.08)', particle: 'rgba(0,0,0,0.06)' }
};

let c = THEME_COLORS[currentTheme];

themeBtn.addEventListener('click', () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  c = THEME_COLORS[currentTheme];
  
  if (currentTheme === 'light') {
    iconSun.style.display = 'none';
    iconMoon.style.display = 'block';
  } else {
    iconSun.style.display = 'block';
    iconMoon.style.display = 'none';
  }
});

// -----------------------------------------------------------------------------
// CONSTANTS & UTILS
// -----------------------------------------------------------------------------
// Backend stream will provide entities

const initialLogs = [
  "[SYSTEM] Ontology Engine Initialized.",
  "[DATA] Connecting to Palantir Foundry...",
  "[DATA] Establishing Multi-modal Data Plane.",
  "[RF] CSI Capture Active. 160MHz Bandwidth.",
];

function r(min, max) { return Math.random() * (max - min) + min; }
function ri(min, max) { return Math.floor(r(min, max)); }

// -----------------------------------------------------------------------------
// BACKGROUND PARTICLE WAVE
// -----------------------------------------------------------------------------
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgW, bgH;
let particles = [];

function initBg() {
  bgW = window.innerWidth;
  bgH = window.innerHeight;
  bgCanvas.width = bgW;
  bgCanvas.height = bgH;
  
  particles = [];
  const spacing = 40;
  for (let x = 0; x < bgW + spacing; x += spacing) {
    for (let y = 0; y < bgH + spacing; y += spacing) {
      particles.push({
        baseX: x, baseY: y,
        x: x, y: y,
        angle: r(0, Math.PI * 2)
      });
    }
  }
}

window.addEventListener('resize', initBg);
initBg();

function drawBg(time) {
  bgCtx.clearRect(0, 0, bgW, bgH);
  bgCtx.fillStyle = c.particle;
  
  particles.forEach(p => {
    // Wave motion using sine
    const offset = Math.sin(p.baseX * 0.01 + time * 0.001) * 20;
    const offset2 = Math.cos(p.baseY * 0.01 + time * 0.0008) * 15;
    
    p.x = p.baseX + offset;
    p.y = p.baseY + offset2;
    
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    bgCtx.fill();
  });
  
  // Optional: Connect very close particles (creates a web effect)
  /*
  bgCtx.strokeStyle = c.particle;
  bgCtx.lineWidth = 0.5;
  bgCtx.beginPath();
  for (let i = 0; i < particles.length; i+=5) {
    const p1 = particles[i];
    bgCtx.moveTo(p1.x, p1.y);
    bgCtx.lineTo(p1.x + 40, p1.y);
  }
  bgCtx.stroke();
  */
}

// -----------------------------------------------------------------------------
// UI ELEMENTS & SIMULATION LOGIC
// -----------------------------------------------------------------------------
const timeEl = document.getElementById('sys-time');
const csiRateEl = document.getElementById('csi-rate');
const noiseFloorEl = document.getElementById('noise-floor');
const logsContainer = document.getElementById('sys-logs');

const radarCanvas = document.getElementById('radar-canvas');
const radarCtx = radarCanvas.getContext('2d');
const poseCanvas = document.getElementById('pose-canvas');
const poseCtx = poseCanvas.getContext('2d');

const elEntityId = document.getElementById('entity-id');
const elEntityType = document.getElementById('entity-type');
const elConfBar = document.getElementById('conf-bar');
const elConfVal = document.getElementById('conf-val');
const elBpmVal = document.getElementById('bpm-val');
const elRespVal = document.getElementById('resp-val');
const elStateVal = document.getElementById('state-val');
const elSigList = document.getElementById('sig-list');

setInterval(() => {
  const d = new Date();
  timeEl.innerText = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')} UTC`;
}, 1000);

function addLog(msg, type = 'sys') {
  const d = new Date();
  const timeStr = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')}`;
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${msg}`;
  logsContainer.prepend(entry);
  if (logsContainer.children.length > 30) logsContainer.removeChild(logsContainer.lastChild);
}

initialLogs.forEach(l => addLog(l));
setTimeout(() => addLog("[BIO] Authorized match: NODE_ALPHA", "bio"), 2000);
setTimeout(() => addLog("[ALERT] Unverified signature detected in quadrant 4", "warn"), 5000);

// -----------------------------------------------------------------------------
// WEBSOCKET INTEGRATION & STATE MANAGEMENT
// -----------------------------------------------------------------------------
let width, height;
function resizeRadar() {
  const rect = radarCanvas.parentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  radarCanvas.width = width;
  radarCanvas.height = height;
}
window.addEventListener('resize', resizeRadar);
resizeRadar();

let targets = [];
let currentTarget = null;
let scanAngle = 0;

const ws = new WebSocket('ws://localhost:8000/ws/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Update Telemetry
  csiRateEl.innerText = data.telemetry.csi_rate.toLocaleString();
  noiseFloorEl.innerText = data.telemetry.noise_floor;
  
  // Update Entities
  data.entities.forEach(serverEntity => {
    let t = targets.find(t => t.id === serverEntity.id);
    const tx = serverEntity.target_pos.x * width;
    const ty = serverEntity.target_pos.y * height;
    
    if (t) {
      t.tx = tx; t.ty = ty;
      t.conf = serverEntity.conf;
      t.bpm = serverEntity.bpm;
      t.resp = serverEntity.resp;
      t.state = serverEntity.state;
      t.type = serverEntity.type;
    } else {
      targets.push({...serverEntity, x: tx, y: ty, tx: tx, ty: ty});
    }
  });
  
  // Remove stale targets
  targets = targets.filter(t => data.entities.some(e => e.id === t.id));
  initSignatures();
};

ws.onopen = () => addLog("[NET] Connected to Backend Data Plane.", "sys");
ws.onerror = () => addLog("[NET] Backend Connection Failed.", "warn");
ws.onclose = () => addLog("[NET] Data Plane Offline.", "warn");

function updateRadar() {
  targets.forEach(t => {
    // Smooth interpolation towards backend-provided coordinates
    t.x += (t.tx - t.x) * 0.1;
    t.y += (t.ty - t.y) * 0.1;
  });
  scanAngle += 0.02;
  
  if (!currentTarget && targets.length > 0) currentTarget = targets[0];
  if (currentTarget && !targets.find(t => t.id === currentTarget.id)) currentTarget = null;
}

function drawRadar() {
  radarCtx.clearRect(0, 0, width, height);
  const cx = width / 2; const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 * 0.9;

  // Draw Circular Radar Grid
  // Increase opacity for thicker/easier to see lines
  const gridColor = currentTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
  radarCtx.strokeStyle = gridColor;
  radarCtx.lineWidth = 2;
  
  // Concentric circles
  for (let r = maxRadius * 0.2; r <= maxRadius; r += maxRadius * 0.2) {
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
    radarCtx.stroke();
  }

  // Angle lines
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
    radarCtx.stroke();
  }

  // Draw Central Hub
  radarCtx.fillStyle = c.textMain;
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, 4, 0, Math.PI*2);
  radarCtx.fill();
  radarCtx.strokeStyle = c.textMuted;
  radarCtx.lineWidth = 2;
  radarCtx.beginPath();
  radarCtx.arc(cx, cy, 15, 0, Math.PI*2);
  radarCtx.stroke();

  // Draw Targets
  targets.forEach(t => {
    const isTarget = t === currentTarget;
    const color = t.type === 'ANOMALY' ? '#ef4444' : (isTarget ? c.primary : c.success);

    // Connecting line to hub
    radarCtx.beginPath();
    radarCtx.moveTo(cx, cy);
    radarCtx.lineTo(t.x, t.y);
    radarCtx.strokeStyle = gridColor;
    radarCtx.lineWidth = 1;
    radarCtx.stroke();

    // Data Box around target
    radarCtx.strokeStyle = color;
    radarCtx.lineWidth = 2;
    radarCtx.strokeRect(t.x - 6, t.y - 6, 12, 12);
    
    // Core dot
    radarCtx.fillStyle = color;
    radarCtx.fillRect(t.x - 2, t.y - 2, 4, 4);

    if (isTarget) {
      radarCtx.beginPath();
      radarCtx.arc(t.x, t.y, 25, 0, Math.PI*2);
      radarCtx.setLineDash([4, 4]);
      radarCtx.strokeStyle = color;
      radarCtx.stroke();
      radarCtx.setLineDash([]);
      
      // Target Label
      radarCtx.font = "11px 'JetBrains Mono'";
      radarCtx.fillStyle = c.textMain;
      radarCtx.fillText(t.id, t.x + 15, t.y - 15);
      radarCtx.fillStyle = c.textMuted;
      radarCtx.fillText(`CONF: ${t.conf}%`, t.x + 15, t.y - 3);
    }
  });

  // Radar Scan Line (Sweeping Arc)
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.arc(cx, cy, maxRadius, scanAngle, scanAngle + 0.3);
  radarCtx.lineTo(cx, cy);
  radarCtx.fillStyle = currentTheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  radarCtx.fill();

  // Leading edge of scan line
  radarCtx.beginPath();
  radarCtx.moveTo(cx, cy);
  radarCtx.lineTo(cx + Math.cos(scanAngle + 0.3) * maxRadius, cy + Math.sin(scanAngle + 0.3) * maxRadius);
  radarCtx.strokeStyle = c.textMuted;
  radarCtx.lineWidth = 2;
  radarCtx.stroke();
}

// -----------------------------------------------------------------------------
// POSE SIMULATION
// -----------------------------------------------------------------------------
let pWidth, pHeight;
function resizePose() {
  const rect = poseCanvas.parentElement.getBoundingClientRect();
  pWidth = rect.width; pHeight = rect.height;
  poseCanvas.width = pWidth; poseCanvas.height = pHeight;
}
window.addEventListener('resize', resizePose);
resizePose();

let posePhase = 0;
function drawPose() {
  poseCtx.clearRect(0, 0, pWidth, pHeight);
  if (!currentTarget) return;

  const cx = pWidth / 2; const cy = pHeight / 2 - 20;
  posePhase += currentTarget.state === 'TRANSITING' ? 0.15 : 0.02;
  const bob = Math.sin(posePhase) * 2;
  
  const head = { x: cx, y: cy - 40 + bob };
  const neck = { x: cx, y: cy - 20 + bob };
  const spine = { x: cx, y: cy + 30 + bob };
  
  const armSwing = currentTarget.state === 'TRANSITING' ? Math.sin(posePhase) * 15 : Math.sin(posePhase)*2;
  const lShoulder = { x: cx - 15, y: neck.y };
  const rShoulder = { x: cx + 15, y: neck.y };
  const lElbow = { x: lShoulder.x - 10, y: lShoulder.y + 20 + armSwing };
  const rElbow = { x: rShoulder.x + 10, y: rShoulder.y + 20 - armSwing };
  const lHand = { x: lElbow.x - 5, y: lElbow.y + 20 + armSwing };
  const rHand = { x: rElbow.x + 5, y: rElbow.y + 20 - armSwing };

  const legSwing = currentTarget.state === 'TRANSITING' ? Math.sin(posePhase) * 20 : 0;
  const lHip = { x: cx - 12, y: spine.y };
  const rHip = { x: cx + 12, y: spine.y };
  const lKnee = { x: lHip.x, y: lHip.y + 30 - legSwing };
  const rKnee = { x: rHip.x, y: rHip.y + 30 + legSwing };
  const lFoot = { x: lKnee.x, y: lKnee.y + 30 };
  const rFoot = { x: rKnee.x, y: rKnee.y + 30 };

  const joints = [head, neck, spine, lShoulder, rShoulder, lElbow, rElbow, lHand, rHand, lHip, rHip, lKnee, rKnee, lFoot, rFoot];
  const bones = [
    [head, neck], [neck, spine], [neck, lShoulder], [neck, rShoulder],
    [lShoulder, lElbow], [lElbow, lHand], [rShoulder, rElbow], [rElbow, rHand],
    [spine, lHip], [spine, rHip], [lHip, lKnee], [lKnee, lFoot], [rHip, rKnee], [rKnee, rFoot]
  ];

  poseCtx.lineWidth = 1;
  poseCtx.strokeStyle = c.textMuted;
  poseCtx.beginPath();
  bones.forEach(b => {
    poseCtx.moveTo(b[0].x, b[0].y);
    poseCtx.lineTo(b[1].x, b[1].y);
  });
  poseCtx.stroke();

  poseCtx.fillStyle = currentTarget.type === 'ANOMALY' ? c.textMuted : c.primary;
  joints.forEach(j => {
    poseCtx.beginPath();
    poseCtx.arc(j.x, j.y, 2.5, 0, Math.PI * 2);
    poseCtx.fill();
  });
}

// -----------------------------------------------------------------------------
// UPDATE INSPECTOR
// -----------------------------------------------------------------------------
function updateInspector() {
  if (!currentTarget) return;
  
  elEntityId.innerText = currentTarget.id;
  elEntityType.innerText = currentTarget.type;
  if(currentTarget.type === 'ANOMALY') {
    elEntityType.style.color = '#ef4444'; // Red for anomaly
    elEntityType.style.borderColor = '#ef4444';
  } else {
    elEntityType.style.color = c.textMuted;
    elEntityType.style.borderColor = c.gridLine;
  }
  
  elConfBar.style.width = `${currentTarget.conf}%`;
  elConfVal.innerText = `${currentTarget.conf}%`;
  
  elBpmVal.innerText = currentTarget.bpm + ri(-1, 2);
  elRespVal.innerText = currentTarget.resp;
  elStateVal.innerText = currentTarget.state;
}

function initSignatures() {
  elSigList.innerHTML = '';
  targets.forEach(e => {
    const li = document.createElement('li');
    li.className = 'signature-item';
    li.innerHTML = `
      <span class="sig-name">${e.name}</span>
      <span class="sig-status">${e.id}</span>
    `;
    elSigList.appendChild(li);
  });
}

setInterval(() => {
  if (targets.length > 0) {
    currentTarget = targets[ri(0, targets.length)];
    addLog(`[SYSTEM] Node Focus Shifted: ${currentTarget.id}`, currentTarget.type === 'ANOMALY' ? 'warn' : 'sys');
  }
}, 12000);

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------
function loop(time) {
  drawBg(time);
  updateRadar();
  drawRadar();
  drawPose();
  
  if (Math.random() > 0.9) updateInspector();
  
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
