import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy initialization — avoids reading GEMINI_API_KEY before the env is
// fully loaded, which can happen when this module is imported at startup.
let _model: ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']> | null = null;

function getModel() {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 350,
        // Disable thinking mode — recommendations are short structured text,
        // not reasoning tasks. Thinking tokens eat into the output budget and
        // cause truncation at lower maxOutputTokens values.
        thinkingConfig: { thinkingBudget: 0 },
      } as Parameters<typeof genAI.getGenerativeModel>[0]['generationConfig'],
    });
  }
  return _model;
}

export async function generateRecommendation(prompt: string): Promise<string> {
  const result = await getModel().generateContent(prompt);
  return result.response.text().trim();
}
