import React from 'react';
import { Theme } from '../types';
import { 
  Sparkles, 
  Cpu, 
  Compass, 
  ShieldCheck, 
  Activity, 
  Award, 
  Battery, 
  Eye, 
  Mail, 
  Github, 
  Zap, 
  Heart, 
  Clock, 
  Code,
  Users,
  Terminal,
  MousePointer,
  Smartphone,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';
import haptics from '../utils/haptics';
import synth from '../utils/synth';
const foundersPhoto = new URL(
  './photo_5963147175640370457_y.jpg',
  import.meta.url
).href;

import { useDateTimeSettings } from '../utils/settingsContext';
import { getStaggerContainerVariants, getStaggerItemVariants, getButtonMotion } from '../utils/motion';

interface AboutTabProps {
  theme: Theme;
}

export default function AboutTab({ theme }: AboutTabProps) {
  const { settings } = useDateTimeSettings();

  // Dynamically generated presets from the centralized motion system
  const containerVariants = getStaggerContainerVariants(settings.animationIntensity, 0.08);
  const itemVariants = getStaggerItemVariants(settings.animationIntensity);

  // High-fidelity card hover physics with automatic fallbacks for minimal/balanced intensity
  const cardHover = {
    hover: settings.animationIntensity === 'minimal' ? {
      scale: 1.01,
      transition: { duration: 0.15 }
    } : settings.animationIntensity === 'balanced' ? {
      y: -3,
      scale: 1.02,
      borderColor: "rgba(255,255,255,0.12)",
      transition: { duration: 0.2 }
    } : settings.animationIntensity === 'supreme' ? {
      y: -6,
      scale: 1.03,
      boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6)",
      borderColor: "rgba(255,255,255,0.22)",
      transition: { type: "spring", stiffness: 200, damping: 15 }
    } : {
      // Cinematic - extremely physical slow deep float
      y: -10,
      scale: 1.04,
      boxShadow: "0 32px 64px -20px rgba(0,0,0,0.7)",
      borderColor: "rgba(255,255,255,0.3)",
      transition: { type: "spring", stiffness: 80, damping: 14 }
    }
  };

  const contactLinks = [
    {
      icon: <Mail className="w-5 h-5 text-emerald-400" />,
      label: "Founder Inquiries",
      value: "founders@dyclock.com",
      url: "mailto:founders@dyclock.com"
    },
    {
      icon: <Compass className="w-5 h-5 text-cyan-400" />,
      label: "Official Portal",
      value: "www.dyclock.com",
      url: "https://dyclock.com"
    },
    {
      icon: <Github className="w-5 h-5 text-purple-400" />,
      label: "Daniel's Workspace",
      value: "github.com/daniel-kidanu",
      url: "https://github.com"
    },
    {
      icon: <Github className="w-5 h-5 text-pink-400" />,
      label: "Yerosen's Workspace",
      value: "github.com/yerosen-daselegn",
      url: "https://github.com"
    }
  ];

  const valuesList = [
    {
      icon: <Heart className="w-5 h-5 text-rose-400" />,
      title: "Handcrafted Artistry",
      description: "We treat software as high craft. Every border gradient, micro-interaction, and layout rhythm is placed with deliberate human intent."
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: "Absolute Precision",
      description: "Time is measured in milliseconds. Our real-time tick engine synchronizes perfectly with system resources for lag-free reliability."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: "Ironclad Reliability",
      description: "Your alarm is a sacred contract. We built DY Clock with absolute local persistence, ensuring wakeups trigger without network reliance."
    },
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: "Next-Gen Innovation",
      description: "Pioneering responsive ambient glow backdrops and synthetic audio frequencies to brighten mornings."
    },
    {
      icon: <Battery className="w-5 h-5 text-teal-400" />,
      title: "Optimal Performance",
      description: "GPU-accelerated vector rendering keeps frames fluid at 60fps while maintaining a virtually invisible battery usage footprint."
    },
    {
      icon: <Eye className="w-5 h-5 text-indigo-400" />,
      title: "Absolute Privacy First",
      description: "We host zero tracking scripts, cookies, or telemetry logs. Your alarm times and custom state live securely and solely on your device."
    },
    {
      icon: <Activity className="w-5 h-5 text-pink-400" />,
      title: "Universal Design",
      description: "DY Clock features intuitive contrast ratios, clear typeface hierarchies, and ergonomic touch targets built for everyone."
    },
    {
      icon: <Award className="w-5 h-5 text-amber-400" />,
      title: "Continuous Progress",
      description: "We issue meticulous updates regularly, optimizing browser compatibility and updating audio wave generators constantly."
    },
    {
      icon: <Users className="w-5 h-5 text-violet-400" />,
      title: "User-First Respect",
      description: "No ads, no interruptions, and no user-hostile monetization loops. The experience remains pure, clean, and entirely yours."
    }
  ];

  const handleLinkClick = () => {
    haptics.success();
    synth.playClick();
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full max-w-3xl mx-auto space-y-16 pb-36 px-4" 
      id="about-tab-wrapper"
    >
      
      {/* 1. LUXURIOUS HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-6 pt-6"
        id="about-hero"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-black tracking-wider text-cyan-400 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span>The Sovereign Chronometer</span>
        </div>
        
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Crafting the Future of <br />
          <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>Aesthetic Time</span>
        </h2>
        
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          DY Clock is not just a digital timepiece; it is a labor of devotion, friendship, and precision engineering designed to redefine the boundary between functionality and art.
        </p>

        {/* INTERACTIVE LOGO INSIGHT */}
        <div className="relative py-8 max-w-sm mx-auto">
          <div className={`absolute inset-0 bg-gradient-to-tr ${theme.gradient} opacity-25 blur-3xl rounded-full`} />
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            onClick={() => { haptics.success(); }}
            className={`relative mx-auto w-40 h-40 rounded-full border border-white/10 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-2xl cursor-pointer ${theme.glow}`}
          >
            {/* Elegant Interlinked D & Y Monogram representation */}
            <div className="flex items-baseline justify-center -space-x-1">
              <span className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">D</span>
              <span className={`text-4xl font-black tracking-tighter bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>Y</span>
            </div>
            <span className="text-[9px] font-extrabold tracking-[0.25em] text-cyan-400 mt-2 uppercase">CLOCK</span>
            
            {/* Spinning orbital indicator rings */}
            <div className="absolute inset-1.5 border border-dashed border-white/5 rounded-full animate-spin-slow pointer-events-none" />
            <div className={`absolute -inset-1 border border-white/5 rounded-full pointer-events-none`} />
          </motion.div>
          <p className="text-[10px] font-bold text-slate-500 mt-3 tracking-widest uppercase">
            Inspired by Daniel (D) & Yerosen (Y)
          </p>
        </div>
      </motion.div>

      {/* 1.5 FOUNDERS REAL PORTRAIT / PHOTO SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ type: "spring", stiffness: 70, damping: 16 }}
        className={`p-6 sm:p-8 rounded-3xl ${theme.cardBg} border ${theme.border} relative overflow-hidden space-y-6 text-center`}
        id="about-founders-portrait"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-500/10 to-transparent blur-2xl pointer-events-none" />
        
        {/* Beautiful frame for the photo with glow */}
        <div className="relative max-w-xs sm:max-w-sm mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
          {/* Accent glow behind the photo */}
          <div className={`absolute -inset-1 bg-gradient-to-tr ${theme.gradient} opacity-20 blur-xl group-hover:opacity-35 transition-opacity duration-500 rounded-2xl`} />
          
          <img 
            src={foundersPhoto} 
            alt="Daniel Kidanu and Yerosen Daselegn - DY Clock Founders" 
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-[440px] rounded-2xl relative z-10 transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>

        {/* Text information */}
        <div className="space-y-3 max-w-xl mx-auto relative z-10 pt-2">
          <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">A Bond of Devotion</span>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">The Founders</h3>
          
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            This photograph captures the genuine friendship, partnership, and shared dedication that inspired the creation of DY Clock. Daniel Kidanu and Yerosen Daselegn founded this space not as a typical commercial enterprise, but as an elegant, high-craft creative medium to bring premium design and mathematics into harmonious, daily utility.
          </p>
          
          <div className="flex justify-center items-center gap-1.5 text-xs font-bold text-slate-400 italic pt-1">
            <span>Daniel Kidanu</span>
            <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${theme.gradient}`} />
            <span>Yerosen Daselegn</span>
          </div>
        </div>
      </motion.section>

      {/* 2. THE BRAND STORY & UNION OF INITIALS */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className={`p-6 sm:p-8 rounded-3xl ${theme.cardBg} border ${theme.border} relative overflow-hidden space-y-6`}
        id="about-brand-identity"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/10 to-transparent blur-2xl pointer-events-none" />
        
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Brand Monogram & Heritage</span>
          <h3 className="text-2xl font-black text-white">The Genesis of the "D" and the "Y"</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The name **DY Clock** is forged directly from the initials of its co-founders, **Daniel Kidanu** and **Yerosen Daselegn**. More than just letters, they represent two interlocking philosophies of modern software creation:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-900/60 space-y-2">
            <div className="inline-flex px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-black text-white">
              D — Daniel Kidanu
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              **The Logic & Structure.** Representing algorithmic optimization, local caching mechanics, precise math validation modules, and peak battery safety profiles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-900/60 space-y-2">
            <div className="inline-flex px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-black text-cyan-400">
              Y — Yerosen Daselegn
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              **The Aesthetics & Humanity.** Representing custom canvas aura renderings, fluid visual transitions, safe nightstand typography, and empathetic touch ergonomics.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic text-center md:text-left">
          When D and Y merged, the result was a flawless synthesis of ironclad engineering and high-fidelity sensory feedback.
        </p>
      </motion.section>

      {/* 3. MEET THE FOUNDERS: DANIEL & YEROSEN */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-8"
        id="about-founders-presentation"
      >
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Architects of Time</span>
          <h3 className="text-2xl font-black text-white">Daniel Kidanu & Yerosen Daselegn</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            A lifelong bond of friendship, trust, and creative passion brought this application to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Founder 1: Daniel Kidanu */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.15 }}
            className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-4 relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-950 to-cyan-500/20 border border-white/15 flex items-center justify-center">
                <span className="text-2xl font-black text-white">DK</span>
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              
              <div>
                <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">Co-Founder & Chief Architect</span>
                <h4 className="text-lg font-bold text-white">Daniel Kidanu</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Daniel oversees the system core. Possessing an unyielding commitment to performance and mathematics, he pioneered the highly responsive custom math solvers, the secure state management pipeline, and optimized the local tick clocks to ensure zero drift even on low-end hardware.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-900 mt-4">
              <p className="text-[11px] text-slate-400 italic">
                "Our alarms are contracts of trust. The engineering must be as clean and bulletproof as mathematics itself."
              </p>
            </div>
          </motion.div>

          {/* Founder 2: Yerosen Daselegn */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.3 }}
            className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-4 relative overflow-hidden flex flex-col justify-between`}
          >
            <div className="space-y-4">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-950 to-pink-500/20 border border-white/15 flex items-center justify-center">
                <span className="text-2xl font-black text-white">YD</span>
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
              </div>

              <div>
                <span className="text-[9px] font-black tracking-widest text-pink-400 uppercase">Co-Founder & Creative Director</span>
                <h4 className="text-lg font-bold text-white">Yerosen Daselegn</h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Yerosen governs the visual and acoustic soul of DY Clock. Driven by clean design principles, ergonomic safety, and organic canvas effects, he custom-designed the smooth sliding digit animations, the neon aura theme controls, and calibrated the Web Audio oscillator waves.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-900 mt-4">
              <p className="text-[11px] text-slate-400 italic">
                "We don't want waking up to feel like a visual punishment. It should be an elegant, supportive ritual."
              </p>
            </div>
          </motion.div>
        </div>

        {/* Celebrating friendship and teamwork statement */}
        <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-900/80 text-center max-w-xl mx-auto space-y-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            🤝 **Founded in Absolute Synergy:** Daniel and Yerosen's journey is built upon transparency, creative play, and mutual accountability. They share a vision of proving that a small, independent group of friends can construct elegant tools that rival the largest software companies in the world.
          </p>
        </div>
      </motion.section>

      {/* 5. MISSION & VISION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6" 
        id="about-mission-vision"
      >
        <div className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-4`}>
          <div className="inline-flex p-3 rounded-2xl bg-slate-950 border border-slate-900/80">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-extrabold text-white">The Mission</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Our mission is to empower individuals to value, manage, and master their most precious asset—time. We believe that by transforming daily utility tools into beautifully engaging human-centric experiences, we elevate the overall quality of modern life.
          </p>
        </div>

        <div className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-4`}>
          <div className="inline-flex p-3 rounded-2xl bg-slate-950 border border-slate-900/80">
            <Eye className="w-5 h-5 text-pink-400" />
          </div>
          <h3 className="text-lg font-extrabold text-white">The Vision</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            We envision DY Clock as a globally recognized premium tool for digital productivity and lifestyle beauty. We aim to prove that modular, fast, and gorgeous software can exist without compromise—setting a brand-new standard for mobile and web utilities.
          </p>
        </div>
      </motion.div>

      {/* 6. VALUES SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-8" 
        id="about-core-values"
      >
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Our Tenets</span>
          <h3 className="text-2xl font-black text-white">Pillars of Craftsmanship</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            These core values guide every single code commit and user interaction we design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {valuesList.map((val, idx) => (
            <motion.div
              key={idx}
              variants={cardHover}
              whileHover="hover"
              className={`p-5 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-3 relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="inline-flex p-2 rounded-xl bg-slate-950 border border-slate-900">
                  {val.icon}
                </div>
                <h4 className="text-sm font-extrabold text-white">{val.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{val.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 7. QUALITY COMMITMENT */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className={`p-6 sm:p-8 rounded-3xl bg-slate-950 border ${theme.border} space-y-4`} 
        id="about-quality-promise"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Our Meticulous Oath</span>
            <h3 className="text-lg font-black text-white">The Quality Commitment</h3>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Every minor patch, major release, and wave generator modification is rigorously tested on real hardware. We guarantee that no updates will ever introduce hidden ad modules, intrusive tracking, or slow down your wake-up sequence. We maintain reliability and maximum performance as the highest imperative of our work.
        </p>
      </motion.section>

      {/* 8. TECHNOLOGY & PHILOSOPHY */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className={`p-6 sm:p-8 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-4`} 
        id="about-engineering"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-900">
            <Code className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">Engineering Blueprint</span>
            <h3 className="text-lg font-black text-white">Technological Rigor</h3>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          The code of DY Clock is written in strict, compile-safe **TypeScript**. By opting for a fully functional React model combined with **Vite** compilation, we achieve near-instant initial load times. Custom browser sound wave generators bypass heavy external mp3 asset downloads, rendering precise frequencies via Web Audio API. 
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {['React 18', 'TypeScript 5', 'Tailwind CSS v4', 'Web Audio API Synth', 'Device Haptics', 'LocalStorage Sandbox'].map((tag) => (
            <span key={tag} className="text-[10px] font-black text-slate-400 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      </motion.section>

      {/* 9. CONTACT SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-6" 
        id="about-contact"
      >
        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Connect with Us</span>
          <h3 className="text-xl font-black text-white">Contact & Social Channels</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {contactLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleLinkClick}
              className={`p-4 rounded-2xl bg-slate-950/80 border ${theme.border} hover:border-white/20 transition-all flex flex-col justify-between space-y-3 cursor-pointer group`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-xl bg-slate-900">
                  {link.icon}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{link.label}</p>
                <p className="text-xs font-bold text-slate-200 mt-1 truncate group-hover:text-cyan-400 transition-colors">{link.value}</p>
              </div>
            </a>
          ))}
        </div>
      </motion.section>

      {/* 10. PREMIUM STORYTELLING FOOTER */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="pt-12 border-t border-slate-900 text-center space-y-4"
        id="about-footer"
      >
        <div className="flex justify-center items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500 via-purple-600 to-blue-600 p-0.5 flex items-center justify-center shadow-lg">
            <span className="text-[10px] font-black tracking-tighter text-white">DY</span>
          </div>
          <span className="text-xs font-black tracking-wider text-white uppercase">DY CLOCK</span>
          <span className="text-[9px] font-bold py-0.5 px-2 rounded bg-cyan-950/40 border border-cyan-900/40 text-cyan-400">v2.5.0</span>
        </div>
        
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          © {new Date().getFullYear()} DY Design Studio. All rights reserved. <br />
          Precision engineered with love, friendship, and neon light in California.
        </p>

        <p className="text-[11px] font-bold text-slate-400 italic max-w-md mx-auto">
          "Thank you for being part of our journey. Together, we make every second beautiful."
        </p>

        <p className={`text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
          Daniel Kidanu & Yerosen Daselegn
        </p>
      </motion.footer>

    </motion.div>
  );
}
