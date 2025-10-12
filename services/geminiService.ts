import { GoogleGenAI } from "@google/genai";
import type { DailyReport } from '../types';

// Fix: Per coding guidelines, the API key must be obtained from `process.env.API_KEY`.
// This also resolves the TypeScript errors related to `import.meta.env` by removing its usage.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY is not defined in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

export const generateProjectSummary = async (projectName: string, reports: DailyReport[]): Promise<string> => {
  const reportsText = reports
    .map(report => `Date: ${report.date}\nTasks: ${report.tasks}\n`)
    .join("\n---\n");

  if (reportsText.length === 0) {
    return "No reports available to generate a summary.";
  }

  const prompt = `
    As an expert construction project analyst, provide a concise summary of the progress for the project named "${projectName}".
    Based on the following daily reports, highlight key activities, mention the latest reported date, and identify any potential patterns or areas of focus.
    The language of the reports is Vietnamese, please provide the summary in Vietnamese.

    Daily Reports:
    ${reportsText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return "An error occurred while generating the AI summary. Please check the console for details.";
  }
};
