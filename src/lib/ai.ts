import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_AI_API_KEY;
const baseURL = 'https://api.lingyaai.cn/v1';

if (!apiKey) {
  console.warn('Missing VITE_AI_API_KEY. Please check your .env.local file.');
}

const domesticApiKey = import.meta.env.VITE_DOMESTIC_AI_API_KEY;

export const openai = new OpenAI({
  apiKey: apiKey || '',
  baseURL,
  dangerouslyAllowBrowser: true,
});

export const domesticOpenai = new OpenAI({
  apiKey: domesticApiKey || apiKey || '',
  baseURL,
  dangerouslyAllowBrowser: true,
});
