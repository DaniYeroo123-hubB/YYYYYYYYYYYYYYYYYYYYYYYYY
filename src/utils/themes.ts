import { Theme } from '../types';

export const THEMES: Theme[] = [
  {
    id: 'neon-aura',
    name: 'Neon Aura',
    primary: 'cyan-400',
    secondary: 'fuchsia-500',
    bg: 'bg-slate-950',
    cardBg: 'bg-slate-900/60 backdrop-blur-md border-slate-800/80',
    text: 'text-slate-100',
    border: 'border-slate-800',
    glow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
    gradient: 'from-cyan-500 to-indigo-600',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    primary: 'yellow-400',
    secondary: 'pink-500',
    bg: 'bg-zinc-950',
    cardBg: 'bg-zinc-900/60 backdrop-blur-md border-zinc-800/80',
    text: 'text-yellow-50',
    border: 'border-zinc-800',
    glow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    gradient: 'from-yellow-400 to-pink-600',
  },
  {
    id: 'midnight-minimal',
    name: 'Midnight Minimal',
    primary: 'slate-200',
    secondary: 'orange-400',
    bg: 'bg-neutral-950',
    cardBg: 'bg-neutral-900/50 backdrop-blur-md border-neutral-800/70',
    text: 'text-neutral-100',
    border: 'border-neutral-800',
    glow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
    gradient: 'from-neutral-700 to-neutral-900',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    primary: 'rose-400',
    secondary: 'amber-200',
    bg: 'bg-rose-950/80',
    cardBg: 'bg-rose-900/30 backdrop-blur-md border-rose-800/40',
    text: 'text-rose-100',
    border: 'border-rose-800/50',
    glow: 'shadow-[0_0_15px_rgba(251,113,133,0.4)]',
    gradient: 'from-rose-400 to-amber-300',
  },
  {
    id: 'forest-amber',
    name: 'Forest Amber',
    primary: 'emerald-400',
    secondary: 'amber-400',
    bg: 'bg-emerald-950/90',
    cardBg: 'bg-emerald-900/30 backdrop-blur-md border-emerald-800/40',
    text: 'text-emerald-50',
    border: 'border-emerald-800/50',
    glow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]',
    gradient: 'from-emerald-400 to-amber-500',
  },
  {
    id: 'classic-silver',
    name: 'Classic Silver',
    primary: 'slate-300',
    secondary: 'blue-400',
    bg: 'bg-slate-900',
    cardBg: 'bg-slate-800/50 backdrop-blur-md border-slate-700/60',
    text: 'text-slate-100',
    border: 'border-slate-700',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.4)]',
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    id: 'cosmic-dusk',
    name: 'Cosmic Dusk',
    primary: 'fuchsia-400',
    secondary: 'orange-400',
    bg: 'bg-slate-950',
    cardBg: 'bg-slate-900/60 backdrop-blur-md border-indigo-950/80',
    text: 'text-slate-100',
    border: 'border-indigo-950',
    glow: 'shadow-[0_0_15px_rgba(217,70,239,0.5)]',
    gradient: 'from-violet-600 via-fuchsia-500 to-orange-400',
  },
  {
    id: 'aurora-dream',
    name: 'Aurora Dream',
    primary: 'emerald-400',
    secondary: 'cyan-400',
    bg: 'bg-slate-950',
    cardBg: 'bg-slate-900/60 backdrop-blur-md border-emerald-950/80',
    text: 'text-emerald-50',
    border: 'border-emerald-950',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    gradient: 'from-emerald-400 via-teal-500 to-blue-600',
  },
  {
    id: 'sunset-velvet',
    name: 'Sunset Velvet',
    primary: 'rose-400',
    secondary: 'violet-400',
    bg: 'bg-zinc-950',
    cardBg: 'bg-zinc-900/60 backdrop-blur-md border-purple-950/70',
    text: 'text-purple-50',
    border: 'border-purple-950',
    glow: 'shadow-[0_0_15px_rgba(192,132,252,0.4)]',
    gradient: 'from-purple-600 via-rose-500 to-amber-400',
  }
];

export interface ThemeClassMap {
  text: string;
  bg: string;
  bgHover: string;
  bgLight: string;
  border: string;
  borderLight: string;
  ring: string;
  shadow: string;
}

export function getThemeClasses(themeId: string): ThemeClassMap {
  switch (themeId) {
    case 'neon-aura':
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-400',
        bgHover: 'hover:bg-cyan-500',
        bgLight: 'bg-cyan-950/30',
        border: 'border-cyan-400',
        borderLight: 'border-cyan-900/30',
        ring: 'ring-cyan-400',
        shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
      };
    case 'cyberpunk':
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-400',
        bgHover: 'hover:bg-yellow-500',
        bgLight: 'bg-yellow-950/30',
        border: 'border-yellow-400',
        borderLight: 'border-yellow-900/30',
        ring: 'ring-yellow-400',
        shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
      };
    case 'midnight-minimal':
      return {
        text: 'text-slate-200',
        bg: 'bg-slate-200',
        bgHover: 'hover:bg-slate-300',
        bgLight: 'bg-slate-900/30',
        border: 'border-slate-200',
        borderLight: 'border-slate-800/40',
        ring: 'ring-slate-200',
        shadow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]',
      };
    case 'rose-gold':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-400',
        bgHover: 'hover:bg-rose-500',
        bgLight: 'bg-rose-950/30',
        border: 'border-rose-400',
        borderLight: 'border-rose-900/20',
        ring: 'ring-rose-400',
        shadow: 'shadow-[0_0_15px_rgba(251,113,133,0.4)]',
      };
    case 'forest-amber':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400',
        bgHover: 'hover:bg-emerald-500',
        bgLight: 'bg-emerald-950/30',
        border: 'border-emerald-400',
        borderLight: 'border-emerald-900/20',
        ring: 'ring-emerald-400',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]',
      };
    case 'classic-silver':
      return {
        text: 'text-slate-300',
        bg: 'bg-slate-300',
        bgHover: 'hover:bg-slate-400',
        bgLight: 'bg-slate-800/30',
        border: 'border-slate-300',
        borderLight: 'border-slate-700/30',
        ring: 'ring-slate-300',
        shadow: 'shadow-[0_0_15px_rgba(148,163,184,0.4)]',
      };
    case 'cosmic-dusk':
      return {
        text: 'text-fuchsia-400',
        bg: 'bg-fuchsia-400',
        bgHover: 'hover:bg-fuchsia-500',
        bgLight: 'bg-fuchsia-950/30',
        border: 'border-fuchsia-400',
        borderLight: 'border-fuchsia-900/30',
        ring: 'ring-fuchsia-400',
        shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.5)]',
      };
    case 'aurora-dream':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400',
        bgHover: 'hover:bg-emerald-500',
        bgLight: 'bg-emerald-950/30',
        border: 'border-emerald-400',
        borderLight: 'border-emerald-900/30',
        ring: 'ring-emerald-400',
        shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      };
    case 'sunset-velvet':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-400',
        bgHover: 'hover:bg-rose-500',
        bgLight: 'bg-rose-950/30',
        border: 'border-rose-400',
        borderLight: 'border-rose-900/30',
        ring: 'ring-rose-400',
        shadow: 'shadow-[0_0_15px_rgba(192,132,252,0.4)]',
      };
    default:
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-400',
        bgHover: 'hover:bg-cyan-500',
        bgLight: 'bg-cyan-950/30',
        border: 'border-cyan-400',
        borderLight: 'border-cyan-900/30',
        ring: 'ring-cyan-400',
        shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]',
      };
  }
}
