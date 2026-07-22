import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../types';
import { getThemeClasses } from '../utils/themes';
import { useSharedClock } from '../utils/clockEngine';
import { useDateTimeSettings } from '../utils/settingsContext';
import { motion } from 'motion/react';
import { drawBezelPath, drawDialPath, drawSpecialComplications } from '../utils/clockStyles';

interface WorkingLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  theme?: Theme;
  clockStyle?: string;
}

export default function WorkingLogo({
  size = 260,
  className = '',
  onClick,
  interactive = true,
  theme,
  clockStyle,
}: WorkingLogoProps) {
  const time = useSharedClock();
  const { settings } = useDateTimeSettings();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Get active style (prop or localStorage fallback, defaults to celestial-orbit)
  const activeStyle = clockStyle || localStorage.getItem('dy_clock_analog_style') || 'celestial-orbit';

  // --- Clock Settings Engine (Persisted in LocalStorage) ---
  const [clockFace, setClockFace] = useState<'classic-luxury' | 'neon-supreme' | 'minimal-black' | 'cyber-blue' | 'skeleton-gold' | 'royal-glass'>(() => {
    return (localStorage.getItem('dy_clock_face') as any) || 'classic-luxury';
  });
  const [batteryFriendly, setBatteryFriendly] = useState<boolean>(() => {
    return localStorage.getItem('dy_clock_battery_friendly') === 'true';
  });
  const [sweepStyle, setSweepStyle] = useState<'sweep' | 'escapement' | 'quartz'>(() => {
    return (localStorage.getItem('dy_clock_sweep_style') as any) || 'sweep';
  });
  const [reflections, setReflections] = useState<boolean>(() => {
    return localStorage.getItem('dy_clock_reflections') !== 'false';
  });
  const [visualDepth, setVisualDepth] = useState<boolean>(() => {
    return localStorage.getItem('dy_clock_visual_depth') !== 'false';
  });
  const [glowIntensity, setGlowIntensity] = useState<'none' | 'low' | 'high'>(() => {
    return (localStorage.getItem('dy_clock_glow_intensity') as any) || 'high';
  });
  const [realtimeLighting, setRealtimeLighting] = useState<boolean>(() => {
    return localStorage.getItem('dy_clock_realtime_lighting') !== 'false';
  });

  const [isHovered, setIsHovered] = useState<boolean>(false);

  // --- Interactive Mouse Parallax Refs ---
  const mouseOffset = useRef({ x: 0, y: 0 });
  const targetMouseOffset = useRef({ x: 0, y: 0 });

  // --- Physical Simulation State Refs ---
  const currentSec = useRef(0);
  const currentMin = useRef(0);
  const currentHour = useRef(0);

  const velSec = useRef(0);
  const velMin = useRef(0);
  const velHour = useRef(0);

  const lastFrameTime = useRef(performance.now());
  const entryProgress = useRef(0); // For sweep-in entry animation
  const isMounted = useRef(false);

  // Star twinkling random phase offset values (for Cosmic Dusk theme)
  const starPhases = useRef<number[]>([]);
  if (starPhases.current.length === 0) {
    starPhases.current = Array.from({ length: 40 }, () => Math.random() * Math.PI * 2);
  }

  // --- Mount entry and mouse listener logic ---
  useEffect(() => {
    isMounted.current = true;
    
    // Set starting angles to 0 for a beautiful continuous entry sweep
    const now = new Date();
    currentHour.current = 0;
    currentMin.current = 0;
    currentSec.current = 0;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mouse move listener for premium parallax reflections
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!reflections) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const my = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    targetMouseOffset.current = { x: mx, y: my };
  };

  const handleMouseLeave = () => {
    targetMouseOffset.current = { x: 0, y: 0 };
  };

  // --- Core Real-Time Canvas Rendering Engine ---
  useEffect(() => {
    let animId: number;

    const render = () => {
      if (!isMounted.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);

      const center = size / 2;
      const radius = size * 0.46;
      const timeNow = performance.now();
      const dt = Math.min((timeNow - lastFrameTime.current) / 1000, 0.1); // Cap delta time to prevent physics explosions
      lastFrameTime.current = timeNow;

      // Battery Friendly Mode checks and overrides to reduce processing power by up to 90%
      const activeSweepStyle = batteryFriendly ? 'quartz' : sweepStyle;
      const activeReflections = batteryFriendly ? false : reflections;
      const activeGlowIntensity = batteryFriendly ? 'none' : glowIntensity;
      const activeRealtimeLighting = batteryFriendly ? false : realtimeLighting;

      // Smoothly interpolate mouse parallax offset
      mouseOffset.current.x += (targetMouseOffset.current.x - mouseOffset.current.x) * 0.08;
      mouseOffset.current.y += (targetMouseOffset.current.y - mouseOffset.current.y) * 0.08;

      // Progress entrance animation on startup
      if (entryProgress.current < 1) {
        entryProgress.current += dt * 0.85; // Elegant slow reveal
        if (entryProgress.current > 1) entryProgress.current = 1;
      }

      // 1. Calculate high-precision target angles (in radians)
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      const ms = now.getMilliseconds();

      let targetSecAngle = 0;
      if (activeSweepStyle === 'sweep') {
        targetSecAngle = ((secs + ms / 1000) / 60) * Math.PI * 2;
      } else if (activeSweepStyle === 'escapement') {
        const beat = Math.floor(ms / 125); // 8 ticks per second
        targetSecAngle = ((secs + (beat * 125) / 1000) / 60) * Math.PI * 2;
      } else {
        // Quartz style: jump on full second
        targetSecAngle = (secs / 60) * Math.PI * 2;
      }

      const targetMinAngle = ((mins + (secs + ms / 1000) / 60) / 60) * Math.PI * 2;
      const targetHourAngle = (((hrs % 12) + (mins + (secs + ms / 1000) / 60) / 60) / 12) * Math.PI * 2;

      // Calculate spring physics for hands (to model physical inertia and settling vibration)
      let springTension = 130;
      let damping = 15;

      if (settings.animationIntensity === 'minimal') {
        springTension = 400;
        damping = 40; // Extremely rigid, near-zero overshoot
      } else if (settings.animationIntensity === 'balanced') {
        springTension = 150;
        damping = 18; // Clean, standard responsive damping
      } else if (settings.animationIntensity === 'supreme') {
        springTension = 320;
        damping = 14; // High tension with a micro-vibrational settle on ticks (like high-end escape mechanisms)
      } else if (settings.animationIntensity === 'cinematic') {
        springTension = 45;
        damping = 8.5; // Slow, luxurious, momentum-heavy sweeping glide
      }

      // Handle angular wrap-around gently
      const processAnglePhysics = (target: number, current: number, velocity: React.MutableRefObject<number>) => {
        let diff = target - current;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // Normalize to -PI to PI
        
        // Basic spring equation: accel = tension * diff - damping * velocity
        const accel = diff * springTension - velocity.current * damping;
        velocity.current += accel * dt;
        return current + velocity.current * dt;
      };

      // Animate hand sweeps (with entry progress scaling for entry look)
      if (entryProgress.current < 1) {
        // Elegant sweeping entry from 12 o'clock
        currentSec.current = processAnglePhysics(targetSecAngle * entryProgress.current, currentSec.current, velSec);
        currentMin.current = processAnglePhysics(targetMinAngle * entryProgress.current, currentMin.current, velMin);
        currentHour.current = processAnglePhysics(targetHourAngle * entryProgress.current, currentHour.current, velHour);
      } else {
        currentSec.current = processAnglePhysics(targetSecAngle, currentSec.current, velSec);
        currentMin.current = processAnglePhysics(targetMinAngle, currentMin.current, velMin);
        currentHour.current = processAnglePhysics(targetHourAngle, currentHour.current, velHour);
      }

      // Clean canvas
      ctx.clearRect(0, 0, size, size);

      // Resolve theme specs
      const themeId = theme?.id || 'neon-aura';
      const themeClasses = getThemeClasses(themeId);
      const isDark = true; // All supreme themes are high-contrast dark modes

      // 2. DRAW OUTER BEZEL (Multi-layered metallic 3D ring)
      drawBezelPath(ctx, center, radius, activeStyle);
      
      const bezelGrad = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
      const specs = getThemeSpecs(themeId);
      let bezelColors = specs.bezelGradient;
      if (activeStyle === 'royal-circular') {
        bezelColors = ['#fef08a', '#eab308', '#ca8a04', '#eab308', '#854d0e'];
      } else if (activeStyle === 'spectre-phantom') {
        bezelColors = ['#090d16', '#10b981', '#064e3b', '#090d16'];
      } else if (activeStyle === 'quantum-plasma') {
        // High glow pink-purple neon bezel
        bezelColors = ['#ec4899', '#a855f7', '#1e1b4b', '#06b6d4'];
      } else if (activeStyle === 'nebula-vortex') {
        bezelColors = ['#3b0764', '#a855f7', '#1e1b4b', '#03001e'];
      } else if (activeStyle === 'solaris-crown') {
        bezelColors = ['#f59e0b', '#b45309', '#facc15', '#f59e0b'];
      }
      bezelColors.forEach((color, idx) => {
        bezelGrad.addColorStop(idx / (bezelColors.length - 1), color);
      });
      ctx.fillStyle = bezelGrad;
      
      if (visualDepth && activeStyle !== 'solaris-crown') {
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = batteryFriendly ? 3 : 3 + mouseOffset.current.x * 2.5;
        ctx.shadowOffsetY = batteryFriendly ? 6 : 6 + mouseOffset.current.y * 2.5;
      }
      ctx.fill();
      
      // Reset shadows for inner components
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw premium decorative details for quantum-plasma
      if (activeStyle === 'quantum-plasma') {
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI) / 6 - Math.PI / 2;
          const px = center + (radius - 4) * Math.cos(angle);
          const py = center + (radius - 4) * Math.sin(angle);
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ec4899' : '#06b6d4';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 4;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Bezel Inner highlight/shading stroke (creates inner wall depth)
      drawBezelPath(ctx, center, radius - 1.5, activeStyle);
      ctx.lineWidth = activeStyle === 'solaris-crown' ? 1 : 3;
      const bezelStrokeGrad = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
      if (activeStyle === 'neon-supreme') {
        bezelStrokeGrad.addColorStop(0, '#22d3ee');
        bezelStrokeGrad.addColorStop(0.5, '#0891b2');
        bezelStrokeGrad.addColorStop(1, '#d946ef');
      } else {
        bezelStrokeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        bezelStrokeGrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
        bezelStrokeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      }
      ctx.strokeStyle = bezelStrokeGrad;
      ctx.stroke();

      // 3. DRAW INNER DIAL FACE
      const dialRadius = radius - 4.5;
      drawDialPath(ctx, center, dialRadius, activeStyle);

      if (activeStyle === 'solaris-crown') {
        // Fiery solar base gradient
        const solarGrad = ctx.createRadialGradient(center, center, dialRadius * 0.15, center, center, dialRadius);
        solarGrad.addColorStop(0, '#7c2d12'); // Rich burnt amber
        solarGrad.addColorStop(0.6, '#1a0500'); // Ultra dark sunset crimson
        solarGrad.addColorStop(1, '#000000');
        ctx.fillStyle = solarGrad;
        ctx.fill();
      } else if (activeStyle === 'quantum-plasma') {
        // Bio-plasma reactor dial gradient with rich dark magenta aura
        const plasmaGrad = ctx.createRadialGradient(center, center, 2, center, center, dialRadius);
        plasmaGrad.addColorStop(0, '#090514'); // Ultra dark purple-indigo center
        plasmaGrad.addColorStop(0.7, '#020105'); // Absolute black
        plasmaGrad.addColorStop(1, '#0c0211'); // Glowing rim
        ctx.fillStyle = plasmaGrad;
        ctx.fill();
      } else if (activeStyle === 'nebula-vortex') {
        const vortexGrad = ctx.createRadialGradient(center, center, 2, center, center, dialRadius);
        vortexGrad.addColorStop(0, '#120b24');
        vortexGrad.addColorStop(0.6, '#060214');
        vortexGrad.addColorStop(1, '#010003');
        ctx.fillStyle = vortexGrad;
        ctx.fill();
      } else if (activeStyle === 'spectre-phantom') {
        // Translucent crystal sapphire face
        const phantomGrad = ctx.createRadialGradient(center, center, 0, center, center, dialRadius);
        phantomGrad.addColorStop(0, 'rgba(6, 78, 59, 0.4)');
        phantomGrad.addColorStop(0.7, 'rgba(2, 44, 34, 0.6)');
        phantomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = phantomGrad;
        ctx.fill();
      } else if (activeStyle === 'celestial-orbit') {
        // Deep space starry black/blue
        const celestialGrad = ctx.createRadialGradient(center, center, 2, center, center, dialRadius);
        celestialGrad.addColorStop(0, '#090d1e');
        celestialGrad.addColorStop(0.6, '#03040b');
        celestialGrad.addColorStop(1, '#000002');
        ctx.fillStyle = celestialGrad;
        ctx.fill();
      } else if (activeStyle === 'neon-supreme') {
        ctx.fillStyle = '#020205';
        ctx.fill();
      } else if (activeStyle === 'royal-circular') {
        // Royal gold guilloché / emerald face
        const royalGrad = ctx.createRadialGradient(center, center, 10, center, center, dialRadius);
        royalGrad.addColorStop(0, '#022c22'); // Rich Emerald green
        royalGrad.addColorStop(0.7, '#011c15');
        royalGrad.addColorStop(1, '#000000');
        ctx.fillStyle = royalGrad;
        ctx.fill();
      } else if (specs.dialBg === 'aurora') {
        const auroraGrad = ctx.createRadialGradient(center - size * 0.15, center - size * 0.15, size * 0.05, center, center, dialRadius);
        auroraGrad.addColorStop(0, '#0a3625');
        auroraGrad.addColorStop(0.25, '#0c4e35');
        auroraGrad.addColorStop(0.55, '#1e1b4b');
        auroraGrad.addColorStop(0.85, '#311042');
        auroraGrad.addColorStop(1, '#050508');
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      } else if (specs.sunburst) {
        const sunGrad = ctx.createRadialGradient(center, center, 2, center, center, dialRadius);
        sunGrad.addColorStop(0, '#ffffff');
        sunGrad.addColorStop(0.1, specs.dialBg);
        sunGrad.addColorStop(0.7, specs.dialBg);
        sunGrad.addColorStop(1, '#000000');
        ctx.fillStyle = sunGrad;
        ctx.fill();
      } else {
        ctx.fillStyle = specs.dialBg;
        ctx.fill();
      }

      // Guilloché pattern for Royal Circular
      if (activeStyle === 'royal-circular') {
        ctx.save();
        drawDialPath(ctx, center, dialRadius, activeStyle);
        ctx.clip();
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.035)';
        ctx.lineWidth = 0.5;
        for (let r = 5; r < dialRadius; r += 3) {
          ctx.beginPath();
          for (let th = 0; th < Math.PI * 2; th += 0.05) {
            const radMod = r + Math.sin(th * 16) * 1.5;
            const px = center + radMod * Math.cos(th);
            const py = center + radMod * Math.sin(th);
            if (th === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.restore();
      }

      // Sunburst lines for themes & classic
      if (specs.sunburst || activeStyle === 'quantum-plasma') {
        ctx.save();
        drawDialPath(ctx, center, dialRadius, activeStyle);
        ctx.clip();
        ctx.translate(center, center);
        for (let a = 0; a < 360; a += 1.5) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const lineLen = dialRadius * (a % 15 === 0 ? 0.95 : 0.88);
          ctx.lineTo(Math.cos(a * Math.PI / 180) * lineLen, Math.sin(a * Math.PI / 180) * lineLen);
          ctx.lineWidth = 0.5;
          ctx.strokeStyle = a % 30 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.035)';
          ctx.stroke();
        }
        ctx.restore();
      }

      // Carbon Fiber mesh texture for Cyberpunk, Hexa, Neon
      if (specs.carbonGrid || activeStyle === 'nebula-vortex' || activeStyle === 'neon-supreme') {
        ctx.save();
        drawDialPath(ctx, center, dialRadius, activeStyle);
        ctx.clip();
        ctx.strokeStyle = activeStyle === 'neon-supreme' ? 'rgba(34, 211, 238, 0.015)' : 'rgba(255,255,255,0.015)';
        ctx.lineWidth = 0.8;
        for (let i = -dialRadius; i < dialRadius; i += 4) {
          ctx.beginPath();
          ctx.moveTo(center + i, center - dialRadius);
          ctx.lineTo(center + i + dialRadius * 2, center + dialRadius);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(center + i, center + dialRadius);
          ctx.lineTo(center + i + dialRadius * 2, center - dialRadius);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Starfield rendering with twinkling for Cosmic Dusk and Celestial Orbit
      if (specs.starry || activeStyle === 'celestial-orbit') {
        ctx.save();
        drawDialPath(ctx, center, dialRadius, activeStyle);
        ctx.clip();
        
        const count = starPhases.current.length;
        for (let i = 0; i < count; i++) {
          const starAngle = (i / count) * Math.PI * 2 + (i * 0.23);
          const starDist = dialRadius * 0.15 + ((i * 17) % Math.floor(dialRadius * 0.7));
          const sx = center + Math.cos(starAngle) * starDist;
          const sy = center + Math.sin(starAngle) * starDist;
          
          const twinklePhase = starPhases.current[i] + (timeNow / 800);
          const opacity = 0.15 + Math.sin(twinklePhase) * 0.55;
          
          ctx.beginPath();
          ctx.arc(sx, sy, (i % 3 === 0) ? 1.2 : 0.7, 0, Math.PI * 2);
          ctx.fillStyle = activeStyle === 'celestial-orbit' 
            ? `rgba(165, 180, 252, ${Math.max(0.12, opacity)})` 
            : `rgba(255, 255, 255, ${Math.max(0.1, opacity)})`;
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. SOLAR TIME RESPONSIVE LIGHTING OVERLAY (Tints clock based on hour of day)
      if (activeRealtimeLighting) {
        ctx.save();
        drawDialPath(ctx, center, dialRadius, activeStyle);
        ctx.clip();
        
        let ambientColor = 'transparent';
        if (hrs >= 6 && hrs < 12) {
          ambientColor = 'rgba(251, 191, 36, 0.05)'; // Warm golden morning
        } else if (hrs >= 12 && hrs < 18) {
          ambientColor = 'rgba(56, 189, 248, 0.03)'; // Crisp daylight blue
        } else if (hrs >= 18 && hrs < 21) {
          ambientColor = 'rgba(244, 63, 94, 0.06)';  // Sunset pink-amber
        } else {
          ambientColor = 'rgba(99, 102, 241, 0.06)';  // Indigo night sky
        }
        ctx.fillStyle = ambientColor;
        ctx.fill();
        ctx.restore();
      }

      // 5. DRAW DIAL ENGRAVINGS AND BRANDING
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Brand Name
      ctx.font = `black ${Math.max(13, size * 0.06)}px "Space Grotesk", "Inter", sans-serif`;
      
      let brandColor = specs.lightDialText ? 'rgba(30, 41, 59, 0.85)' : 'rgba(248, 250, 252, 0.9)';
      let modelColor = specs.lightDialText ? 'rgba(71, 85, 105, 0.65)' : 'rgba(148, 163, 184, 0.45)';
      
      if (activeStyle === 'royal-circular') {
        brandColor = 'rgba(234, 179, 8, 0.85)'; // Gold
        modelColor = 'rgba(234, 179, 8, 0.5)';
      } else if (activeStyle === 'spectre-phantom') {
        brandColor = '#10b981'; // Neon emerald
        modelColor = 'rgba(52, 211, 153, 0.4)';
      } else if (activeStyle === 'nebula-vortex') {
        brandColor = '#ec4899'; // Magenta
        modelColor = 'rgba(168, 85, 247, 0.4)';
      } else if (activeStyle === 'neon-supreme') {
        brandColor = '#22d3ee';
        modelColor = '#d946ef';
      } else if (activeStyle === 'solaris-crown') {
        brandColor = '#eab308'; // Solar Gold
        modelColor = 'rgba(249, 115, 22, 0.5)';
      } else if (activeStyle === 'quantum-plasma') {
        brandColor = '#06b6d4'; // Cyan neon branding
        modelColor = 'rgba(236, 72, 153, 0.6)'; // Pink secondary label
      }

      ctx.fillStyle = brandColor;
      ctx.fillText('DY', center, center - dialRadius * 0.4);

      // Model label
      ctx.font = `bold ${Math.max(6, size * 0.03)}px "JetBrains Mono", monospace`;
      ctx.fillStyle = modelColor;
      
      let modelLabel = 'SUPREME ENGINE';
      if (activeStyle === 'quantum-plasma') modelLabel = 'QUANTUM PLASMA';
      else if (activeStyle === 'neon-supreme') modelLabel = 'NEON SUPREME';
      else if (activeStyle === 'royal-circular') modelLabel = 'ROYAL CHRONOMETER';
      else if (activeStyle === 'nebula-vortex') modelLabel = 'NEBULA VORTEX';
      else if (activeStyle === 'solaris-crown') modelLabel = 'SOLARIS CORONA';
      else if (activeStyle === 'spectre-phantom') modelLabel = 'SPECTRE PHANTOM';
      else if (activeStyle === 'celestial-orbit') modelLabel = 'CELESTIAL ORBIT';

      // For quantum-plasma, let's write "BIOPLASMA CORE" and "REACTOR SYNC"
      if (activeStyle === 'quantum-plasma') {
        ctx.save();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.65)';
        ctx.font = `bold ${Math.max(5, size * 0.024)}px "JetBrains Mono", monospace`;
        ctx.fillText('BIOPLASMA CORE', center, center - dialRadius * 0.22);
        ctx.fillText('REACTOR SYNC', center, center + dialRadius * 0.22);
        ctx.restore();
      } else {
        ctx.fillText(modelLabel, center, center + dialRadius * 0.38);
      }

      // 6. DRAW DIAL MARKERS (Hours & Minutes)
      const isGlowActive = activeGlowIntensity !== 'none';
      const glowBlurRad = activeGlowIntensity === 'high' ? 14 : 6;

      ctx.save();
      drawDialPath(ctx, center, dialRadius, activeStyle);
      ctx.clip();

      const numTicks = 60;
      for (let i = 0; i < numTicks; i++) {
        const angle = (i * 360 / numTicks) * Math.PI / 180;
        const isHour = i % 5 === 0;
        const isQuarter = i % 15 === 0;

        let tickStart = dialRadius * (isHour ? (isQuarter ? 0.81 : 0.85) : 0.91);
        let tickEnd = dialRadius * 0.96;
        
        if (activeStyle === 'solaris-crown') {
          if (!isQuarter) continue;
          tickStart = dialRadius * 0.88;
          tickEnd = dialRadius * 0.92;
        }

        const x1 = center + tickStart * Math.sin(angle);
        const y1 = center - tickStart * Math.cos(angle);
        const x2 = center + tickEnd * Math.sin(angle);
        const y2 = center - tickEnd * Math.cos(angle);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        if (isHour) {
          ctx.lineWidth = isQuarter ? Math.max(2.5, size * 0.012) : Math.max(1.5, size * 0.008);
          
          let mColor = specs.markerColor;
          let mGlow = specs.markerGlow;
          
          if (activeStyle === 'royal-circular') {
            mColor = '#fbbf24'; // Gold ticks
            mGlow = '#fbbf24';
          } else if (activeStyle === 'spectre-phantom') {
            mColor = '#10b981'; // Emerald ticks
            mGlow = '#10b981';
          } else if (activeStyle === 'nebula-vortex') {
            mColor = '#ec4899'; // Magenta ticks
            mGlow = '#ec4899';
          } else if (activeStyle === 'neon-supreme') {
            mColor = '#22d3ee';
            mGlow = '#22d3ee';
          } else if (activeStyle === 'solaris-crown') {
            mColor = '#f59e0b';
            mGlow = '#f59e0b';
          } else if (activeStyle === 'quantum-plasma') {
            mColor = '#06b6d4'; // Cyan neon accent ticks
            mGlow = '#ec4899'; // Glowing pink aura
          }

          ctx.strokeStyle = isQuarter 
            ? (specs.lightDialText ? '#1e293b' : mColor) 
            : (specs.lightDialText ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.6)');
          
          if (isGlowActive && mGlow && !specs.lightDialText) {
            ctx.save();
            ctx.shadowColor = mGlow;
            ctx.shadowBlur = glowBlurRad;
            ctx.stroke();
            ctx.restore();
          } else {
            ctx.stroke();
          }
        } else {
          // Regular minute marks
          ctx.lineWidth = Math.max(0.6, size * 0.0035);
          let normalTickColor = specs.lightDialText ? 'rgba(71,85,105,0.35)' : 'rgba(255,255,255,0.2)';
          if (activeStyle === 'spectre-phantom') {
            normalTickColor = 'rgba(16, 185, 129, 0.15)';
          } else if (activeStyle === 'royal-circular') {
            normalTickColor = 'rgba(251, 191, 36, 0.15)';
          }
          ctx.strokeStyle = normalTickColor;
          ctx.stroke();
        }
      }
      ctx.restore();

      // Draw Hour Numbers (12, 3, 6, 9)
      if (activeStyle !== 'solaris-crown') {
        const isRoyal = activeStyle === 'royal-circular';
        const isStealth = activeStyle === 'spectre-phantom';
        const isHex = activeStyle === 'nebula-vortex';
        const isNeon = activeStyle === 'neon-supreme';
        const isQuantum = activeStyle === 'quantum-plasma';
        
        let numFontFamily = '"Space Grotesk", sans-serif';
        if (isRoyal) numFontFamily = '"Playfair Display", "Georgia", serif';
        else if (isHex || isStealth) numFontFamily = '"JetBrains Mono", monospace';
        else if (isQuantum) numFontFamily = '"Space Grotesk", sans-serif';
        
        const numFont = `bold ${Math.max(14, size * 0.075)}px ${numFontFamily}`;
        ctx.font = numFont;
        
        let numFillStyle = specs.lightDialText ? 'rgba(15,23,42,0.9)' : '#ffffff';
        if (isRoyal) numFillStyle = '#fbbf24'; // Gold hour numbers
        else if (isStealth) numFillStyle = '#10b981'; // Emerald hour numbers
        else if (isHex) numFillStyle = '#ec4899'; // Pink hour numbers
        else if (isNeon) numFillStyle = '#22d3ee'; // Neon Cyan numbers
        else if (isQuantum) numFillStyle = '#06b6d4'; // Cyan neon hour numbers

        ctx.fillStyle = numFillStyle;
        const numPadding = dialRadius * 0.72;
        
        if (visualDepth) {
          ctx.save();
          ctx.shadowColor = isRoyal ? 'rgba(0,0,0,0.5)' : numFillStyle;
          ctx.shadowBlur = isRoyal ? 4 : 8;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
        }
        
        ctx.fillText('12', center, center - numPadding + 1.5);
        ctx.fillText('3', center + numPadding - 1, center);
        ctx.fillText('6', center, center + numPadding - 1.5);
        ctx.fillText('9', center - numPadding + 1, center);
        
        if (visualDepth) {
          ctx.restore();
        }
      }

      // Draw Special Complications and animations from our helper module
      drawSpecialComplications(ctx, center, dialRadius, activeStyle, timeNow, currentSec.current, specs.accentColor);

      // 7. DRAW HAND SHADOWS (For hyper-realistic 3D layered depth)
      if (visualDepth) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 4 + mouseOffset.current.x * 2;
        ctx.shadowOffsetY = 6 + mouseOffset.current.y * 2;

        // Hour Shadow
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(currentHour.current);
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-Math.max(2, size * 0.015), 0);
        ctx.lineTo(0, -dialRadius * 0.52);
        ctx.lineTo(Math.max(2, size * 0.015), 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.restore();

        // Minute Shadow
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(currentMin.current);
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-Math.max(1.5, size * 0.011), 0);
        ctx.lineTo(0, -dialRadius * 0.76);
        ctx.lineTo(Math.max(1.5, size * 0.011), 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.restore();

        // Second Shadow
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(currentSec.current);
        ctx.beginPath();
        ctx.moveTo(0, dialRadius * 0.16);
        ctx.lineTo(0, -dialRadius * 0.88);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        ctx.restore();
      }

      // Resolve hand colors based on activeStyle
      let hLight = specs.handColorLight;
      let hDark = specs.handColorDark;
      let accent = specs.accentColor;
      
      if (activeStyle === 'royal-circular') {
        hLight = '#fbbf24'; // Gold Breguet hands
        hDark = '#d97706';
        accent = '#3b82f6'; // heated steel blue hand
      } else if (activeStyle === 'spectre-phantom') {
        hLight = '#ffffff';
        hDark = '#10b981';
        accent = '#10b981';
      } else if (activeStyle === 'nebula-vortex') {
        hLight = '#ffffff';
        hDark = '#a855f7';
        accent = '#ec4899';
      } else if (activeStyle === 'neon-supreme') {
        hLight = '#ffffff';
        hDark = '#06b6d4';
        accent = '#f43f5e';
      } else if (activeStyle === 'solaris-crown') {
        hLight = 'rgba(255, 255, 255, 0.95)';
        hDark = 'rgba(245, 158, 11, 0.6)';
        accent = '#f97316';
      } else if (activeStyle === 'quantum-plasma') {
        // High glow cyan and pink hands with bright white accents
        hLight = '#ffffff';
        hDark = '#06b6d4';
        accent = '#ec4899'; // Stunning neon pink second hand
      }

      // 8. DRAW HOUR HAND
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(currentHour.current);

      if (activeStyle === 'royal-circular') {
        // Classic Royal Breguet gold hand with eye/hollow loop
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(0, -dialRadius * 0.4);
        ctx.strokeStyle = hLight;
        ctx.lineWidth = Math.max(2, size * 0.01);
        ctx.stroke();

        // Circle ring on the hand shaft
        ctx.beginPath();
        ctx.arc(0, -dialRadius * 0.38, Math.max(4.5, size * 0.018), 0, Math.PI * 2);
        ctx.fillStyle = hLight;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -dialRadius * 0.38, Math.max(2, size * 0.008), 0, Math.PI * 2);
        ctx.fillStyle = '#022c22'; // Emerald bg color matching
        ctx.fill();
      } else if (activeStyle === 'solaris-crown') {
        // Floating glass/neon needle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -dialRadius * 0.52);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 6;
        ctx.stroke();
      } else {
        // Standard sword-faceted creased hands
        const hHalfWidth = Math.max(3.5, size * 0.018);
        const hLength = dialRadius * 0.52;

        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(-hHalfWidth, 0);
        ctx.lineTo(0, -hLength);
        ctx.closePath();
        ctx.fillStyle = hLight;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.lineTo(hHalfWidth, 0);
        ctx.lineTo(0, -hLength);
        ctx.closePath();
        ctx.fillStyle = hDark;
        ctx.fill();

        if (activeGlowIntensity !== 'none') {
          ctx.beginPath();
          ctx.moveTo(0, 2);
          ctx.lineTo(0, -hLength * 0.85);
          ctx.strokeStyle = activeStyle === 'obsidian-edge' ? '#f59e0b' : specs.markerColor;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      ctx.restore();

      // 9. DRAW MINUTE HAND
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(currentMin.current);

      if (activeStyle === 'royal-circular') {
        // Breguet gold minute hand
        ctx.beginPath();
        ctx.moveTo(0, 12);
        ctx.lineTo(0, -dialRadius * 0.65);
        ctx.strokeStyle = hLight;
        ctx.lineWidth = Math.max(1.5, size * 0.007);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -dialRadius * 0.62, Math.max(3.8, size * 0.015), 0, Math.PI * 2);
        ctx.fillStyle = hLight;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -dialRadius * 0.62, Math.max(1.5, size * 0.006), 0, Math.PI * 2);
        ctx.fillStyle = '#022c22';
        ctx.fill();
      } else if (activeStyle === 'solaris-crown') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -dialRadius * 0.74);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.stroke();
      } else {
        const mHalfWidth = Math.max(2.5, size * 0.013);
        const mLength = dialRadius * 0.76;

        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(-mHalfWidth, 0);
        ctx.lineTo(0, -mLength);
        ctx.closePath();
        ctx.fillStyle = hLight;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(mHalfWidth, 0);
        ctx.lineTo(0, -mLength);
        ctx.closePath();
        ctx.fillStyle = hDark;
        ctx.fill();

        if (activeGlowIntensity !== 'none') {
          ctx.beginPath();
          ctx.moveTo(0, 3);
          ctx.lineTo(0, -mLength * 0.88);
          ctx.strokeStyle = activeStyle === 'obsidian-edge' ? '#f59e0b' : specs.markerColor;
          ctx.lineWidth = 1.2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
      ctx.restore();

      // 10. DRAW SECOND HAND
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(currentSec.current);

      const sLength = dialRadius * 0.88;
      const sTail = dialRadius * 0.16;

      if (activeStyle === 'celestial-orbit') {
        // Shooting star trailing second hand
        const starGrad = ctx.createLinearGradient(0, sTail, 0, -sLength);
        starGrad.addColorStop(0, 'rgba(251, 191, 36, 0.02)');
        starGrad.addColorStop(0.7, 'rgba(251, 191, 36, 0.35)');
        starGrad.addColorStop(1, '#fbbf24');
        
        ctx.beginPath();
        ctx.moveTo(0, sTail);
        ctx.lineTo(0, -sLength);
        ctx.strokeStyle = starGrad;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -sLength, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, sTail);
        ctx.lineTo(0, -sLength);
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1, size * 0.005);
        ctx.lineCap = 'round';
        
        if (isGlowActive && !specs.lightDialText) {
          ctx.shadowColor = accent;
          ctx.shadowBlur = glowBlurRad;
        }
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw counterweight
        if (activeStyle !== 'solaris-crown') {
          ctx.beginPath();
          ctx.arc(0, sTail * 0.6, Math.max(3.5, size * 0.016), 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, sTail * 0.6, Math.max(1.5, size * 0.007), 0, Math.PI * 2);
          ctx.fillStyle = activeStyle === 'royal-circular' 
            ? '#022c22' 
            : activeStyle === 'quantum-plasma'
              ? '#020105'
              : activeStyle === 'nebula-vortex'
                ? '#020205'
                : activeStyle === 'spectre-phantom'
                  ? 'rgba(6, 78, 59, 0.45)'
                  : specs.dialBg === 'aurora' ? '#0d2a23' : specs.dialBg;
          ctx.fill();
        }
      }
      ctx.restore();

      // 11. CENTRAL PIN CAP COVER
      ctx.beginPath();
      ctx.arc(center, center, Math.max(5.5, size * 0.024), 0, Math.PI * 2);
      const pinGrad = ctx.createRadialGradient(center - 1.5, center - 1.5, 0, center, center, Math.max(5.5, size * 0.024));
      pinGrad.addColorStop(0, '#ffffff');
      pinGrad.addColorStop(0.3, specs.handColorLight);
      pinGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = pinGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(center, center, Math.max(5.5, size * 0.024), 0, Math.PI * 2);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Center shiny diamond pivot point
      ctx.beginPath();
      ctx.arc(center, center, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = specs.accentColor;
      ctx.fill();

      // 12. DYNAMIC CURVED GLASS REFLECTION LENS (Parallax and slowly shifting glare)
      if (activeReflections) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, dialRadius, 0, Math.PI * 2);
        ctx.clip();

        // 3D Dome reflection sweep: slowly drifts over time
        const sweepAngle = (timeNow / 6500) % (Math.PI * 2);
        const driftX = Math.cos(sweepAngle) * 3.5;
        const driftY = Math.sin(sweepAngle) * 2;

        // Main upper glare (Shifts with mouse parallax)
        const glareX = center - dialRadius * 0.35 + mouseOffset.current.x * (dialRadius * 0.16) + driftX;
        const glareY = center - dialRadius * 0.35 + mouseOffset.current.y * (dialRadius * 0.16) + driftY;
        const glareRadius = dialRadius * 0.85;

        const glassGrad = ctx.createRadialGradient(glareX, glareY, 0, glareX, glareY, glareRadius);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        glassGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.04)');
        glassGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
        
        ctx.beginPath();
        ctx.arc(center, center, dialRadius, 0, Math.PI * 2);
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // Secondary diagonal light sheen beam
        const sheenX = center + mouseOffset.current.x * (dialRadius * 0.28);
        const sheenY = center + mouseOffset.current.y * (dialRadius * 0.28);
        
        const sheenGrad = ctx.createLinearGradient(sheenX - dialRadius, sheenY - dialRadius, sheenX + dialRadius, sheenY + dialRadius);
        sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
        sheenGrad.addColorStop(0.48, 'rgba(255,255,255,0)');
        sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.065)');
        sheenGrad.addColorStop(0.52, 'rgba(255,255,255,0.01)');
        sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = sheenGrad;
        ctx.fill();

        ctx.restore();
      }

      // Loop frame
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [size, theme, sweepStyle, reflections, visualDepth, glowIntensity, realtimeLighting, clockStyle, activeStyle]);

  // Helper theme spec loader for Canvas
  function getThemeSpecs(id: string) {
    switch (id) {
      case 'neon-aura':
        return {
          bezelGradient: ['#27272a', '#09090b', '#27272a'],
          dialBg: '#090d16',
          markerColor: '#06b6d4',
          markerGlow: '#06b6d4',
          handColorLight: '#ffffff',
          handColorDark: '#94a3b8',
          accentColor: '#d946ef',
          carbonGrid: false,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
      case 'cyberpunk':
        return {
          bezelGradient: ['#3f3f46', '#18181b', '#3f3f46'],
          dialBg: '#050508',
          markerColor: '#facc15',
          markerGlow: '#facc15',
          handColorLight: '#fef08a',
          handColorDark: '#ca8a04',
          accentColor: '#06b6d4',
          carbonGrid: true,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
      case 'midnight-minimal':
        return {
          bezelGradient: ['#1e293b', '#020617', '#1e293b'],
          dialBg: '#030712',
          markerColor: '#374151',
          markerGlow: '',
          handColorLight: '#e2e8f0',
          handColorDark: '#475569',
          accentColor: '#ffffff',
          carbonGrid: false,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
      case 'rose-gold':
        return {
          bezelGradient: ['#fda4af', '#e11d48', '#fda4af', '#9f1239', '#fda4af'],
          dialBg: '#fffafb',
          markerColor: '#e11d48',
          markerGlow: '',
          handColorLight: '#fef08a',
          handColorDark: '#ca8a04',
          accentColor: '#be123c',
          carbonGrid: false,
          sunburst: true,
          starry: false,
          lightDialText: true,
        };
      case 'forest-amber':
        return {
          bezelGradient: ['#fbbf24', '#78350f', '#fbbf24'],
          dialBg: '#022c22',
          markerColor: '#fbbf24',
          markerGlow: '#fbbf24',
          handColorLight: '#fef08a',
          handColorDark: '#b45309',
          accentColor: '#10b981',
          carbonGrid: false,
          sunburst: true,
          starry: false,
          lightDialText: false,
        };
      case 'classic-silver':
        return {
          bezelGradient: ['#f1f5f9', '#94a3b8', '#f1f5f9', '#475569', '#f1f5f9'],
          dialBg: '#f1f5f9',
          markerColor: '#0f172a',
          markerGlow: '',
          handColorLight: '#ffffff',
          handColorDark: '#64748b',
          accentColor: '#1d4ed8', // Heated blue hand
          carbonGrid: false,
          sunburst: true,
          starry: false,
          lightDialText: true,
        };
      case 'cosmic-dusk':
        return {
          bezelGradient: ['#e9d5ff', '#581c87', '#3b0764', '#e9d5ff'],
          dialBg: '#020617',
          markerColor: '#f472b6',
          markerGlow: '#f472b6',
          handColorLight: '#fdf4ff',
          handColorDark: '#c084fc',
          accentColor: '#fb7185',
          carbonGrid: false,
          sunburst: false,
          starry: true,
          lightDialText: false,
        };
      case 'aurora-dream':
        return {
          bezelGradient: ['#475569', '#0f172a', '#475569'],
          dialBg: 'aurora',
          markerColor: '#34d399',
          markerGlow: '#34d399',
          handColorLight: '#f0fdf4',
          handColorDark: '#52525b',
          accentColor: '#22d3ee',
          carbonGrid: false,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
      case 'sunset-velvet':
        return {
          bezelGradient: ['#fecdd3', '#9f1239', '#fecdd3'],
          dialBg: '#1e1b4b',
          markerColor: '#f43f5e',
          markerGlow: '#f43f5e',
          handColorLight: '#fef08a',
          handColorDark: '#d97706',
          accentColor: '#fb7185',
          carbonGrid: false,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
      default:
        return {
          bezelGradient: ['#3f3f46', '#18181b', '#3f3f46'],
          dialBg: '#090d16',
          markerColor: '#06b6d4',
          markerGlow: '#06b6d4',
          handColorLight: '#ffffff',
          handColorDark: '#cbd5e1',
          accentColor: '#d946ef',
          carbonGrid: false,
          sunburst: false,
          starry: false,
          lightDialText: false,
        };
    }
  }

  const gradientClass = theme?.gradient || 'from-cyan-500 to-indigo-600';

  const isCircular = activeStyle !== 'quantum-plasma' && activeStyle !== 'spectre-phantom';

  // Dynamic glow color matching the active theme or default cyan/blue
  const glowColor = theme?.id === 'forest-amber' 
    ? 'rgba(234, 179, 8, 0.8)' 
    : theme?.id === 'cosmic-dusk' 
      ? 'rgba(236, 72, 153, 0.8)' 
      : theme?.id === 'sunset-velvet'
        ? 'rgba(244, 63, 94, 0.8)'
        : 'rgba(34, 211, 238, 0.85)';

  // Shape-aware drop shadow filters (combining a subtle 3D physical drop shadow with neon outline glow)
  const baseShadow = activeStyle === 'quantum-plasma'
    ? 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5))'
    : 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55))';

  const hoverShadow = `drop-shadow(0 0 20px ${glowColor}) drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6))`;

  // Clean up any square box shadows passed from parent to avoid square box-shadows behind the circular/shaped clock
  const cleanedClassName = className
    .split(' ')
    .filter(c => !c.startsWith('shadow-') && !c.includes('shadow-') && !c.includes('hover:shadow-'))
    .join(' ');

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
      style={{ width: size, height: size }}
      className={`relative select-none ${cleanedClassName}`}
      id="living-analog-clock-wrapper"
    >
      {/* Dynamic breathing glowing atmospheric aura background */}
      {glowIntensity !== 'none' && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-tr ${gradientClass} rounded-full pointer-events-none`}
          animate={{
            opacity: glowIntensity === 'high' ? [0.18, 0.38, 0.18] : [0.08, 0.18, 0.08],
            scale: [0.95, 1.04, 0.95],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ filter: 'blur(30px)', transform: 'scale(0.92)' }}
          id="living-clock-atmospheric-glow"
        />
      )}

      {/* Main Luxury Dial Canvas */}
      <canvas
        ref={canvasRef}
        onClick={onClick}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isCircular ? '50%' : '0%',
          filter: isHovered && interactive ? hoverShadow : baseShadow,
          transform: isHovered && interactive ? 'scale(1.025)' : 'scale(1)',
          transition: 'filter 250ms cubic-bezier(0.4, 0, 0.2, 1), transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className={`block relative z-10 ${interactive ? 'cursor-pointer active:scale-[0.98]' : ''}`}
        id="living-clock-canvas"
      />
    </div>
  );
}
