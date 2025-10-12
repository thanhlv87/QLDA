// FIX: Removed invalid frontmatter which was causing compilation errors.
import { GoogleGenAI } from "@google/genai";
import type { DailyReport, Project } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProjectSummary = async (project: Project, reports: DailyReport[]): Promise<string> => {
  // FIX: Removed explicit API key check to comply with guidelines, which state to assume the key is always available via environment variables. The existing try-catch block will handle runtime API errors.

  const reportsText = reports
    .map(report => `Date: ${report.date}\nTasks: ${report.tasks}\n`)
    .join("\n---\n");

  if (reportsText.length === 0) {
    return "No reports available to generate a summary.";
  }
  
  const today = new Date();
  const formattedCurrentDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const prompt = `
    As an expert construction project analyst, provide a clear and concise summary (around 5-7 lines or a few key bullet points) of the project's progress.

    **Project Context:**
    - Project Name: "${project.name}"
    - Key Dates: Start ${project.constructionStartDate}, Planned End ${project.plannedAcceptanceDate}
    - Today's Date: ${formattedCurrentDate}

    **Your Task:**
    Based on the daily reports, provide a summary that is easy to grasp quickly. Structure your response with these key sections:
    1.  **Đánh giá Chung (Overall Assessment):** Briefly evaluate the project's status (e.g., on track, behind schedule) based on the timeline.
    2.  **Hoạt động Chính Gần đây (Key Recent Activities):** List the most significant accomplishments from the latest reports.
    3.  **Rủi ro & Vấn đề Cần chú ý (Risks & Points of Attention):** Highlight any potential issues, blockers, or items that need attention. If none, state that.

    **Output Format:**
    - Use Markdown for clear formatting (bolding, headings, lists).
    - The entire summary **must be in Vietnamese**.

    **Daily Reports Data:**
    ---
    ${reportsText}
    ---
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
