import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDateTimeSettings } from '../utils/settingsContext';
import { SPRING_PRESETS } from '../utils/motion';

interface SlidingDigitProps {
  key?: React.Key;
  digit: string;
  className?: string;
  width?: string;
}

/**
 * Renders a single character with a smooth sliding animation
 * whenever the character value shifts.
 */
export default function SlidingDigit({
  digit,
  className = '',
  width = '0.62em',
}: SlidingDigitProps) {
  const { settings } = useDateTimeSettings();
  const springPreset = SPRING_PRESETS[settings.animationIntensity] || SPRING_PRESETS.supreme;

  return (
    <span
      className={`relative inline-flex overflow-hidden ${className}`}
      style={{ height: '1.15em', minHeight: '1.15em', width }}
    >
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{
            type: 'spring',
            ...springPreset,
          }}
          className="absolute inset-0 flex items-center justify-center select-none"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
