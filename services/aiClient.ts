import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKeyFromEnv } from './runtimeConfig.js';

export const getGeminiApiKey = (): string => getGeminiApiKeyFromEnv();

export const createGeminiClient = (): GoogleGenAI => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set VITE_GEMINI_API_KEY for browser usage.');
  }

  return new GoogleGenAI({ apiKey });
};
