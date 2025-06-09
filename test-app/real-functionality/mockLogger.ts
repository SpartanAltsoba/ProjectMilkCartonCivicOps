export const logger = {
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data || ""),
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data || ""),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data || ""),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data || ""),
};
