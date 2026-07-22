import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'motion/react';
import { AnimationIntensity } from '../utils/motion';
import haptics from '../utils/haptics';

interface DockButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  intensity: AnimationIntensity;
  id: string;
}

export default function DockButton({
  isActive,
  onClick,
  label,
  icon,
  intensity,
  id,
}: DockButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Mouse coordinate track motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Configure high-fidelity springs matched to user's intensity preference
  const getSpringConfig = () => {
    switch (intensity) {
      case 'minimal':
        return { damping: 40, stiffness: 400, mass: 1 };
      case 'balanced':
        return { damping: 20, stiffness: 200, mass: 0.8 };
      case 'supreme':
        return { damping: 14, stiffness: 280, mass: 0.6 }; // Snappy, premium magnetic snap
      case 'cinematic':
      default:
        return { damping: 10, stiffness: 60, mass: 1.2 }; // Smooth cinematic momentum
    }
  };

  const springConfig = getSpringConfig();

  // Create springs for the different layers to introduce an absolute 3D parallax effect
  // Layer 1: Active background highlight (medium pull)
  const bgX = useSpring(mouseX, springConfig);
  const bgY = useSpring(mouseY, springConfig);

  // Layer 2: Core Icon (strong magnetic pull)
  const iconX = useSpring(mouseX, springConfig);
  const iconY = useSpring(mouseY, springConfig);

  // Layer 3: Text Label (very subtle pull)
  const textX = useSpring(mouseX, springConfig);
  const textY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (intensity === 'minimal' || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;

    // Different strengths per layer for depth parallax
    const iconStrength = intensity === 'cinematic' ? 0.45 : 0.38;
    const bgStrength = intensity === 'cinematic' ? 0.28 : 0.22;
    const textStrength = intensity === 'cinematic' ? 0.18 : 0.12;

    mouseX.set(offsetX);
    mouseY.set(offsetY);

    // Apply custom scaling factor mapping through the hook or inline transform
    iconX.set(offsetX * iconStrength);
    iconY.set(offsetY * iconStrength);

    bgX.set(offsetX * bgStrength);
    bgY.set(offsetY * bgStrength);

    textX.set(offsetX * textStrength);
    textY.set(offsetY * textStrength);
  };

  const handleMouseEnter = () => {
    // Subtle tactile trigger when entering the magnetic zone to emphasize physical feedback
    if (intensity !== 'minimal') {
      haptics.tick();
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    iconX.set(0);
    iconY.set(0);
    bgX.set(0);
    bgY.set(0);
    textX.set(0);
    textY.set(0);
  };

  const handlePointerDown = () => {
    requestAnimationFrame(() => {
      haptics.light();
    });
  };

  const handleClick = () => {
    onClick();
  };

  // Button Hover & Tap variants with tactile spring curves
  const getButtonVariants = () => {
    return {
      rest: { scale: 1 },
      hover: {
        scale: 1.1,
        transition: {
          type: 'spring',
          stiffness: 350,
          damping: 15,
          mass: 0.5,
        },
      },
      tap: {
        scale: 0.95,
        transition: {
          type: 'spring',
          stiffness: 600,
          damping: 15,
          mass: 0.5,
        },
      },
    };
  };

  // Icon Hover variants
  const getIconVariants = () => {
    return {
      rest: { scale: 1, filter: 'drop-shadow(0 0 0px rgba(0,0,0,0))' },
      hover: {
        scale: 1.05,
        filter: isActive
          ? 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.15))'
          : 'drop-shadow(0 4px 16px rgba(255, 255, 255, 0.35))',
      },
      tap: {
        scale: 1,
      },
    };
  };

  return (
    <motion.button
      ref={ref}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      variants={getButtonVariants()}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`relative flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all gap-1 cursor-pointer z-10 ${
        isActive
          ? 'text-slate-950 font-bold'
          : 'text-slate-400 hover:text-white'
      }`}
      id={id}
    >
      {/* 1. Background Layer (Active Layout Transition or Hover Indication) */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            layoutId="activeTabBackground"
            style={{ x: bgX, y: bgY }}
            className="absolute inset-0 bg-slate-100 rounded-xl -z-10 shadow-lg"
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.7 }}
          />
        )}
      </AnimatePresence>

      {/* 2. Icon Layer with strong magnetic drag & hover glow */}
      <motion.div
        style={{ x: iconX, y: iconY }}
        variants={getIconVariants()}
        transition={{ type: 'spring', ...springConfig }}
        className="relative flex items-center justify-center pointer-events-none"
      >
        {icon}
      </motion.div>

      {/* 3. Text Label Layer with ultra-subtle lag for drag-behind feel */}
      <motion.span
        style={{ x: textX, y: textY }}
        transition={{ type: 'spring', ...springConfig }}
        className="text-[10px] font-bold select-none pointer-events-none"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
