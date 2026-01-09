import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'Missing Gemini API key. Please check your .env.local file or environment variables.',
  );
}

export const ai = new GoogleGenAI({ apiKey: apiKey || '' });
