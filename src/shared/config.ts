/**
 * MCED Configuration
 * Central configuration file for the application
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export const MCEDConfig = {
  DEBUG_MODE: isDevelopment,
  DEBUG_JAR_LOADING: isDevelopment,
  DEBUG_ITEM_REGISTRY: isDevelopment,
  DEBUG_FLUID_REGISTRY: isDevelopment,
  BUNDLE_SIZE_WARNING: 1000,
  MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000,
  ENABLE_PERFORMANCE_MONITORING: false,
};

/**
 * Helper function for conditional logging
 * In production, this becomes a no-op
 */
export function debugLog(...args: any[]) {
  if (MCEDConfig.DEBUG_MODE) {
    console.log(...args);
  }
}

/**
 * Override console.log in production
 * This will silence ALL console.log statements in production
 */
if (!isDevelopment) {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.debug = noop;
}
