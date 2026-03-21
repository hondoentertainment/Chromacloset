const readProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  return undefined;
};

export const getRuntimeEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }
  return readProcessEnv(key);
};

export const isDevMode = (): boolean => {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env?.DEV === 'boolean') {
    return import.meta.env.DEV;
  }
  return readProcessEnv('NODE_ENV') !== 'production';
};

export const isInternalToolsEnabled = (): boolean => isDevMode() || getRuntimeEnv('VITE_ENABLE_INTERNAL_TOOLS') === 'true';

export const isRemoteAnalyticsEnabledFromEnv = (): boolean => getRuntimeEnv('VITE_ANALYTICS_REMOTE_ENABLED') === 'true';

export const getGeminiApiKeyFromEnv = (): string => getRuntimeEnv('VITE_GEMINI_API_KEY') ?? getRuntimeEnv('API_KEY') ?? '';
