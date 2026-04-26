import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.4,
    topP: 0.85,
    maxOutputTokens: 250,
  },
});

export async function generateRecommendation(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
