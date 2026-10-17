import { useReducedMotion } from 'framer-motion';

export const EASE = [0.4, 0, 0.2, 1] as const;

/** Every Framer animation goes through this so prefers-reduced-motion is honoured. */
export function useMotion() {
  const reduced = useReducedMotion() ?? false;
  const transition = (ms: 150 | 200 | 250 = 200) => ({ duration: reduced ? 0 : ms / 1000, ease: EASE });
  return { reduced, transition };
}
