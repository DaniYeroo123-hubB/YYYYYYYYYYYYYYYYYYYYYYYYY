import { AppSettings } from './settingsContext';

// Bezel and dial path helpers
export const drawBezelPath = (ctx: CanvasRenderingContext2D, center: number, r: number, style: string) => {
  if (style === 'quantum-plasma') {
    // Beautiful sharp 12-pointed luxury star bezel (representing the 12 hours)
    ctx.beginPath();
    const points = 12;
    for (let s = 0; s < points * 2; s++) {
      const angle = (s * Math.PI) / points - Math.PI / 2;
      const currR = s % 2 === 0 ? r : r * 0.88;
      const hx = center + currR * Math.cos(angle);
      const hy = center + currR * Math.sin(angle);
      if (s === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  } else if (style === 'spectre-phantom') {
    // Beautiful octagonal stealth shape
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const angle = (s * Math.PI * 2) / 8 - Math.PI / 8;
      const hx = center + r * Math.cos(angle);
      const hy = center + r * Math.sin(angle);
      if (s === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  } else {
    // Pure circle for celestial-orbit, neon-supreme, royal-circular, nebula-vortex, solaris-crown
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
  }
};

export const drawDialPath = (ctx: CanvasRenderingContext2D, center: number, r: number, style: string) => {
  if (style === 'quantum-plasma') {
    // Beautiful concentric circular dial nested inside the 12-pointed star bezel
    ctx.beginPath();
    ctx.arc(center, center, r * 0.85, 0, Math.PI * 2);
  } else if (style === 'spectre-phantom') {
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const angle = (s * Math.PI * 2) / 8 - Math.PI / 8;
      const hx = center + r * Math.cos(angle);
      const hy = center + r * Math.sin(angle);
      if (s === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(center, center, r, 0, Math.PI * 2);
  }
};

export const drawSpecialComplications = (
  ctx: CanvasRenderingContext2D,
  center: number,
  dialRadius: number,
  activeStyle: string,
  timeNow: number,
  currentSec: number,
  accentColor: string
) => {
  if (activeStyle === 'quantum-plasma') {
    // Pulsing Bio-plasma Reactor Fusion Core at the bottom center
    const subCX = center;
    const subCY = center + dialRadius * 0.38;
    const subRad = dialRadius * 0.22;
    
    ctx.save();
    
    // Draw plasma energy rings
    const numRings = 3;
    for (let k = 0; k < numRings; k++) {
      const ringPulse = 1 + Math.sin(timeNow / (400 + k * 150)) * 0.15;
      const r = subRad * (0.4 + k * 0.3) * ringPulse;
      ctx.beginPath();
      ctx.arc(subCX, subCY, r, 0, Math.PI * 2);
      ctx.strokeStyle = k === 0 ? '#ec4899' : k === 1 ? '#06b6d4' : '#a855f7';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 4 + Math.sin(timeNow / 200) * 3;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Outer chamber
    ctx.beginPath();
    ctx.arc(subCX, subCY, subRad, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Chamber energy emitters
    for (let j = 0; j < 6; j++) {
      const emitterAngle = (j * Math.PI * 2) / 6;
      const ex = subCX + subRad * Math.cos(emitterAngle);
      const ey = subCY + subRad * Math.sin(emitterAngle);
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#22d3ee';
      ctx.fill();
    }

    // Centered rotating energy blade/second sub-hand
    ctx.translate(subCX, subCY);
    ctx.rotate(currentSec);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -subRad + 1);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center glowing nodule
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.fill();

    ctx.restore();
  }

  if (activeStyle === 'nebula-vortex') {
    ctx.save();
    
    // Swirling black-hole stardust particles orbiting
    const numDust = 36;
    const angleOffset = timeNow / 1200;
    for (let i = 0; i < numDust; i++) {
      const r = (i / numDust) * dialRadius * 0.78 + 4;
      const angle = (i * 0.35) + angleOffset * (1.1 - r / dialRadius);
      const px = center + r * Math.cos(angle);
      const py = center + r * Math.sin(angle);
      const dustSize = Math.max(0.6, (1 - r / dialRadius) * 2.5);
      
      ctx.beginPath();
      ctx.arc(px, py, dustSize, 0, Math.PI * 2);
      // Beautiful gradient color palette of royal purple to neon magenta
      ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#a855f7';
      ctx.shadowColor = i % 2 === 0 ? '#ec4899' : '#a855f7';
      ctx.shadowBlur = 5;
      ctx.fill();
    }

    // Centered neon burning hyper-star core
    const coreGlow = 7 + Math.sin(timeNow / 180) * 2.5;
    ctx.beginPath();
    ctx.arc(center, center, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = coreGlow;
    ctx.fill();
    
    ctx.restore();
  }

  if (activeStyle === 'solaris-crown') {
    ctx.save();
    // Beautiful Bezier-curved golden solar flares with pulsing animation
    const numFlares = 24;
    const flarePulse = Math.sin(timeNow / 500) * 0.08 + 1.0;
    const baseRadius = dialRadius * 0.42;
    
    ctx.translate(center, center);
    ctx.rotate(timeNow / 30000); // Slow orbital rotation
    
    for (let i = 0; i < numFlares; i++) {
      const angle = (i * Math.PI * 2) / numFlares;
      const flareHeight = dialRadius * 0.24 * flarePulse * (0.8 + Math.sin(timeNow / 120 + i) * 0.2);
      
      ctx.beginPath();
      ctx.moveTo(baseRadius * Math.cos(angle - 0.04), baseRadius * Math.sin(angle - 0.04));
      
      const ctrlR = baseRadius + flareHeight * 0.45;
      const ctrlAngle = angle + 0.06;
      const endR = baseRadius + flareHeight;
      const endAngle = angle + 0.1;
      
      ctx.quadraticCurveTo(
        ctrlR * Math.cos(ctrlAngle), ctrlR * Math.sin(ctrlAngle),
        endR * Math.cos(endAngle), endR * Math.sin(endAngle)
      );
      ctx.quadraticCurveTo(
        ctrlR * Math.cos(ctrlAngle - 0.03), ctrlR * Math.sin(ctrlAngle - 0.03),
        baseRadius * Math.cos(angle + 0.04), baseRadius * Math.sin(angle + 0.04)
      );
      ctx.closePath();
      
      const flareGrad = ctx.createRadialGradient(0, 0, baseRadius, 0, 0, baseRadius + flareHeight);
      flareGrad.addColorStop(0, 'rgba(245, 158, 11, 0.85)'); // Vibrant amber
      flareGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.45)'); // Sunset rose red
      flareGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      
      ctx.fillStyle = flareGrad;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 5;
      ctx.fill();
    }
    
    ctx.restore();
  }

  if (activeStyle === 'spectre-phantom') {
    // Glowing electronic trace-lines & mechanical Open Heart emerald green balance wheel
    const subCX = center - dialRadius * 0.42;
    const subCY = center;
    const subRad = dialRadius * 0.22;

    ctx.save();
    
    // Draw neon circuit trace lines inside the crystal dial
    ctx.beginPath();
    ctx.moveTo(center - dialRadius * 0.35, center - dialRadius * 0.35);
    ctx.lineTo(center + dialRadius * 0.25, center - dialRadius * 0.35);
    ctx.lineTo(center + dialRadius * 0.4, center);
    ctx.lineTo(center - dialRadius * 0.1, center + dialRadius * 0.42);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    
    // Laser point pulsing indicator
    if (Math.sin(timeNow / 120) > 0.7) {
      ctx.beginPath();
      ctx.arc(center + dialRadius * 0.4, center, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(subCX, subCY, subRad, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 78, 59, 0.45)'; // Translucent emerald green pocket
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // High frequency balance wheel oscillations
    const wheelAngle = Math.sin(timeNow / 55) * Math.PI * 0.95;
    ctx.translate(subCX, subCY);
    ctx.rotate(wheelAngle);

    // Rim
    ctx.beginPath();
    ctx.arc(0, 0, subRad * 0.82, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#059669';
    ctx.stroke();

    // Spokes
    for (let k = 0; k < 3; k++) {
      const spokeAngle = (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(spokeAngle) * (subRad * 0.82), Math.sin(spokeAngle) * (subRad * 0.82));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#34d399';
      ctx.stroke();
    }
    ctx.restore();
  }

  if (activeStyle === 'royal-circular') {
    // Elegant golden Moonphase dial in the upper center
    const subCX = center;
    const subCY = center - dialRadius * 0.15;
    const subRad = dialRadius * 0.18;

    ctx.save();
    ctx.beginPath();
    ctx.arc(subCX, subCY, subRad, Math.PI, 0); // Semi-circle
    ctx.fillStyle = '#051124'; // Deep midnight sky
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Draw golden moon
    ctx.beginPath();
    ctx.arc(subCX - 4, subCY - 8, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(subCX + 8, subCY - 12, 0.8, 0, Math.PI * 2);
    ctx.arc(subCX - 12, subCY - 10, 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  if (activeStyle === 'celestial-orbit') {
    // Starry Sun in center
    ctx.save();
    const sunGrad = ctx.createRadialGradient(center, center, 0, center, center, dialRadius * 0.12);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.3, '#f59e0b');
    sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.beginPath();
    ctx.arc(center, center, dialRadius * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Orbit ring path
    ctx.beginPath();
    ctx.arc(center, center, dialRadius * 0.58, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Orbiting Saturn
    const planetAngle = (timeNow / 8000) % (Math.PI * 2);
    const px = center + Math.cos(planetAngle) * (dialRadius * 0.58);
    const py = center + Math.sin(planetAngle) * (dialRadius * 0.58);

    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#a5b4fc';
    ctx.fill();

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 6);
    ctx.scale(1.8, 0.4);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#e0e7ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  if (activeStyle === 'neon-supreme') {
    ctx.save();
    const ringPulse = 1 + Math.sin(timeNow / 1200) * 0.02;
    ctx.beginPath();
    ctx.arc(center, center, dialRadius * 0.78 * ringPulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, dialRadius * 0.45 * (2 - ringPulse), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
};
