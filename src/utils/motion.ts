import { Transition, Variants } from 'motion/react';

export type AnimationIntensity = 'minimal' | 'balanced' | 'supreme' | 'cinematic';

// Strict requirement: Page transition duration between 200 ms and 250 ms
export const PAGE_TRANSITION_DURATION = 0.22; // 220ms
export const PAGE_EASE: [number, number, number, number] = [0.25, 1, 0.5, 1]; // Soft cubic-bezier ease-in-out curve

// High-fidelity spring presets matching Apple-level physics
export const SPRING_PRESETS = {
  minimal: {
    type: 'spring' as const,
    stiffness: 380,
    damping: 40,
    mass: 1,
  },
  balanced: {
    type: 'spring' as const,
    stiffness: 180,
    damping: 22,
    mass: 0.9,
  },
  supreme: {
    type: 'spring' as const,
    stiffness: 320,
    damping: 18,
    mass: 0.75, // Snappy, premium, highly energetic
  },
  cinematic: {
    type: 'spring' as const,
    stiffness: 75,
    damping: 15,
    mass: 1.3, // Luxurious, slow-sweeping
  },
};

// Fluid cubic-bezier eases for backup / non-spring animations
export const EASE_PRESETS = {
  minimal: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
  balanced: [0.16, 1, 0.3, 1] as [number, number, number, number],
  supreme: PAGE_EASE,
  cinematic: [0.85, 0, 0.15, 1] as [number, number, number, number],
};

/**
 * Returns a robust Transition definition matched to the user's intensity preference.
 */
export function getSpringTransition(
  _intensity: AnimationIntensity = 'supreme',
  delay = 0,
  overrides?: Partial<Transition>
): Transition {
  return {
    duration: PAGE_TRANSITION_DURATION,
    ease: PAGE_EASE,
    delay,
    ...overrides,
  };
}

/**
 * Generates directional custom Page Transition Variants (horizontal slide + smooth fade + soft ease-in-out).
 * Duration: 220ms (between 200ms and 250ms).
 */
export function getPageVariants(
  intensity: AnimationIntensity = 'supreme',
  isReducedMotion: boolean = false
): Variants {
  if (isReducedMotion || intensity === 'minimal') {
    return {
      initial: { opacity: 0, x: 0 },
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          duration: PAGE_TRANSITION_DURATION,
          ease: PAGE_EASE,
        },
      },
      exit: {
        opacity: 0,
        x: 0,
        transition: {
          duration: PAGE_TRANSITION_DURATION,
          ease: PAGE_EASE,
        },
      },
    };
  }

  return {
    initial: (direction: number = 1) => ({
      opacity: 0,
      x: direction >= 0 ? 28 : -28,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: PAGE_TRANSITION_DURATION,
        ease: PAGE_EASE,
      },
    },
    exit: (direction: number = 1) => ({
      opacity: 0,
      x: direction >= 0 ? -28 : 28,
      transition: {
        duration: PAGE_TRANSITION_DURATION,
        ease: PAGE_EASE,
      },
    }),
  };
}

/**
 * Secondary screen & modal page variants combining horizontal slide + smooth fade over 220ms.
 */
export function getSecondaryScreenVariants(isReducedMotion: boolean = false): Variants {
  if (isReducedMotion) {
    return {
      initial: { opacity: 0, x: 0 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: PAGE_TRANSITION_DURATION, ease: PAGE_EASE },
      },
      exit: {
        opacity: 0,
        x: 0,
        transition: { duration: PAGE_TRANSITION_DURATION, ease: PAGE_EASE },
      },
    };
  }

  return {
    initial: { opacity: 0, x: 28 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: PAGE_TRANSITION_DURATION, ease: PAGE_EASE },
    },
    exit: {
      opacity: 0,
      x: 28,
      transition: { duration: PAGE_TRANSITION_DURATION, ease: PAGE_EASE },
    },
  };
}

/**
 * Custom micro-interactions for hover and press animations.
 */
export function getButtonMotion(intensity: AnimationIntensity = 'supreme') {
  if (intensity === 'minimal') {
    return {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
    };
  }
  if (intensity === 'balanced') {
    return {
      whileHover: { scale: 1.04, y: -1 },
      whileTap: { scale: 0.96 },
    };
  }
  if (intensity === 'supreme') {
    return {
      whileHover: { scale: 1.05, y: -2, filter: 'brightness(1.1)' },
      whileTap: { scale: 0.95, y: 0 },
    };
  }
  return {
    whileHover: { 
      scale: 1.08, 
      y: -3, 
      filter: 'brightness(1.15) drop-shadow(0 10px 18px rgba(0,0,0,0.35))',
    },
    whileTap: { 
      scale: 0.93, 
      y: 1,
      filter: 'brightness(0.95)',
    },
  };
}

/**
 * Micro-stagger utilities for lists and grid child elements.
 */
export function getStaggerContainerVariants(intensity: AnimationIntensity = 'supreme', staggerChildren = 0.04): Variants {
  if (intensity === 'minimal') {
    return {
      initial: {},
      animate: { transition: { staggerChildren: 0.02 } },
    };
  }
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: intensity === 'cinematic' ? 0.08 : staggerChildren,
      },
    },
  };
}

export function getStaggerItemVariants(intensity: AnimationIntensity = 'supreme'): Variants {
  switch (intensity) {
    case 'minimal':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      };
    case 'balanced':
      return {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };
    case 'supreme':
      return {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };
    case 'cinematic':
    default:
      return {
        initial: { opacity: 0, y: 20, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
      };
  }
}
