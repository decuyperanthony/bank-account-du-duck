/**
 * PWA Cache clearing utility
 * Use this to clear stale caches when authentication changes
 */
export const clearPWACache = async (): Promise<void> => {
  // Unregister all service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }

  // Clear all caches
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
};

/**
 * Clear cache and force reload the page
 */
export const clearCacheAndReload = async (): Promise<void> => {
  await clearPWACache();
  window.location.reload();
};
