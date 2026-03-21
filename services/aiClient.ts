import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKeyFromEnv } from './runtimeConfig.js';

export const getGeminiApiKey = (): string => getGeminiApiKeyFromEnv();

const readRuntimeEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key];
  }

  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }

  return undefined;
};

export const getGeminiApiKey = (): string => {
  return readRuntimeEnv('VITE_GEMINI_API_KEY')
    ?? readRuntimeEnv('API_KEY')
    ?? '';
};

export const createGeminiClient = (): GoogleGenAI => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY for browser usage.');
  }

  return new GoogleGenAI({ apiKey });
};
