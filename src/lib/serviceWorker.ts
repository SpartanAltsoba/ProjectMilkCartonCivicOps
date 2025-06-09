import { logger } from "./logger";

interface ServiceWorkerConfig {
  swUrl: string;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  /**
   * Register a service worker
   */
  async register(config: ServiceWorkerConfig): Promise<void> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      logger.warn("Service workers are not supported in this environment");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register(config.swUrl);
      this.registration = registration;

      logger.info("Service worker registered successfully", {
        scope: registration.scope,
      });

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              // New content is available
              logger.info("New content is available; please refresh");
              config.onUpdate?.(registration);
            } else {
              // Content is cached for offline use
              logger.info("Content is cached for offline use");
              config.onSuccess?.(registration);
            }
          }
        });
      });

      // Handle successful registration
      if (registration.active) {
        config.onSuccess?.(registration);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Service worker registration failed");
      logger.error("Service worker registration failed", err);
      config.onError?.(err);
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const result = await registration.unregister();

      if (result) {
        logger.info("Service worker unregistered successfully");
        this.registration = null;
      }

      return result;
    } catch (error) {
      logger.error("Service worker unregistration failed", error);
      return false;
    }
  }

  /**
   * Update the service worker
   */
  async update(): Promise<void> {
    if (!this.registration) {
      logger.warn("No service worker registration found");
      return;
    }

    try {
      await this.registration.update();
      logger.info("Service worker update check completed");
    } catch (error) {
      logger.error("Service worker update failed", error);
    }
  }

  /**
   * Get the current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  /**
   * Check if service worker is supported
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator;
  }

  /**
   * Send a message to the service worker
   */
  async sendMessage(message: any): Promise<void> {
    if (!this.registration || !this.registration.active) {
      logger.warn("No active service worker to send message to");
      return;
    }

    try {
      this.registration.active.postMessage(message);
      logger.debug("Message sent to service worker", { message });
    } catch (error) {
      logger.error("Failed to send message to service worker", error);
    }
  }

  /**
   * Listen for messages from the service worker
   */
  onMessage(callback: (event: MessageEvent) => void): void {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("message", callback);
  }

  /**
   * Remove message listener
   */
  offMessage(callback: (event: MessageEvent) => void): void {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.removeEventListener("message", callback);
  }
}

// Utility functions for common service worker operations
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

/**
 * Register service worker with default configuration
 */
export const registerSW = async (swUrl: string = "/sw.js"): Promise<void> => {
  await serviceWorkerManager.register({
    swUrl,
    onSuccess: _registration => {
      logger.info("Service worker is ready for offline use");
    },
    onUpdate: _registration => {
      logger.info("New content available, please refresh the page");
      // You might want to show a notification to the user here
    },
    onError: error => {
      logger.error("Service worker registration error", error);
    },
  });
};

/**
 * Unregister service worker
 */
export const unregisterSW = async (): Promise<boolean> => {
  return serviceWorkerManager.unregister();
};

/**
 * Check if the app is running offline
 */
export const isOffline = (): boolean => {
  return typeof window !== "undefined" && !navigator.onLine;
};

/**
 * Listen for online/offline status changes
 */
export const onNetworkStatusChange = (callback: (isOnline: boolean) => void): (() => void) => {
  if (typeof window === "undefined") {
    return () => {}; // Return empty cleanup function
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
};

export { ServiceWorkerManager };
