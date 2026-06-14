import { validateLayout } from './validate-layout.mjs';

/**
 * @param {object} layout
 * @returns {{ width: number, height: number, layers: object[] }}
 */
export function loadLayout(layout) {
  const errors = validateLayout(layout);
  if (errors.length) {
    throw new Error(`Invalid layout: ${errors.join('; ')}`);
  }
  return {
    width: 640,
    height: 360,
    background: layout.background,
    layers: layout.layers,
    daily_loops: layout.daily_loops || [],
    sequence: layout.sequence || [],
    mood: layout.mood || '',
    status: layout.status || 'draft'
  };
}

export { validateLayout };
