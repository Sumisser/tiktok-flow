import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_AI_API_KEY;
const baseURL = 'https://api.lingyaai.cn/v1';

if (!apiKey) {
  console.warn('Missing VITE_AI_API_KEY. Please check your .env.local file.');
}

export const openai = new OpenAI({
  apiKey: apiKey || '',
  baseURL,
  dangerouslyAllowBrowser: true,
});
