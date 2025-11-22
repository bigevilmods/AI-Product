
import { GoogleGenAI } from "@google/genai";

export const API_KEY_STORAGE_KEY = 'user-provided-api-key';

/**
 * Retrieves the user-provided API key from local storage.
 */
export const getUserApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

/**
 * Saves the user-provided API key to local storage.
 * @param key The API key string to save.
 */
export const setUserApiKey = (key: string): void => {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
};

/**
 * Removes the user-provided API key from local storage.
 */
export const clearUserApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

/**
 * Gets the effective API key, prioritizing user-provided key over environment variable.
 * Throws an error if no key is available.
 */
export const getEffectiveApiKey = (): string => {
    const userApiKey = getUserApiKey();
    // For local Vite development, use `import.meta.env.VITE_API_KEY`.
    // In the target environment (e.g., AI Studio), `process.env.API_KEY` is injected.
    const envApiKey = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_KEY : undefined) || process.env.API_KEY;
    const apiKey = userApiKey || envApiKey;


    if (!apiKey) {
        if (window.location.href.includes('videoGenerator')) {
            throw new Error("API Key not found. For Veo, please re-select your API key.");
        }
        throw new Error("API Key not found. Please set your key in the user settings or configure it in the environment.");
    }
    return apiKey;
};


/**
 * Gets an instance of the GoogleGenAI client using the effective API key.
 */
export const getGoogleGenAI = (): GoogleGenAI => {
  const apiKey = getEffectiveApiKey();
  return new GoogleGenAI({ apiKey });
};
