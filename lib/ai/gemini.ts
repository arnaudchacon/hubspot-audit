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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The free tier allows 5 requests/min and a full audit makes 8 (7 issues +
// executive summary), so 429s are expected, not exceptional. The error body
// includes a retryDelay — honor it (capped) and retry before falling back.
function parseRetryDelayMs(message: string): number {
  const match = message.match(/retry in ([\d.]+)s/i) ?? message.match(/"retryDelay":"(\d+)s"/);
  const seconds = match ? parseFloat(match[1]) : 20;
  // The API reports when the quota window actually frees — trust it, capped
  // to stay inside the route's 60s budget.
  return Math.min(Math.ceil(seconds + 2), 55) * 1000;
}

export async function generateRecommendation(prompt: string, retries = 3): Promise<string> {
  try {
    const result = await getModel().generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (retries > 0 && message.includes('429')) {
      // Rate limited — honor the API's stated retry delay.
      await sleep(parseRetryDelayMs(message));
      return generateRecommendation(prompt, retries - 1);
    }
    if (retries > 0 && message.includes('503')) {
      // Transient "model overloaded" — no delay hint in the body, so back off
      // a few seconds and try again.
      await sleep(4000);
      return generateRecommendation(prompt, retries - 1);
    }
    throw err;
  }
}
