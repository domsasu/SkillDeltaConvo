import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const isGeminiConfigured = (): boolean =>
  typeof process.env.API_KEY === "string" && process.env.API_KEY.length > 0;

export type SkillGapAnalysis = {
  foundSkills: string[];
  skillOpportunities: string[];
  keySkills: string[];
  relevantSkills: string[];
  unusualResumeSkills: string[];
  summaryNote?: string;
};

function parseSkillGapJson(text: string): SkillGapAnalysis {
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean) as Record<string, unknown>;
  const arr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  return {
    foundSkills: arr(parsed.foundSkills),
    skillOpportunities: arr(parsed.skillOpportunities),
    keySkills: arr(parsed.keySkills),
    relevantSkills: arr(parsed.relevantSkills),
    unusualResumeSkills: arr(parsed.unusualResumeSkills),
    summaryNote:
      typeof parsed.summaryNote === "string" ? parsed.summaryNote : undefined,
  };
}

export const analyzeSkillGap = async (params: {
  resumeText: string;
  jobTitle: string;
  jobDescriptionText: string;
}): Promise<SkillGapAnalysis | null> => {
  if (!ai) return null;

  const { resumeText, jobTitle, jobDescriptionText } = params;

  const model = "gemini-2.5-flash";
  const prompt = `
You are a career coach and labor-market analyst. Analyze the resume against the target role.

Resume text:
---
${resumeText.slice(0, 24_000)}
---

Target job title: ${jobTitle || "(not specified)"}

Job description (may be empty):
---
${jobDescriptionText.slice(0, 24_000)}
---

Rules:
- Extract concrete, short skill phrases (2–5 words each), no duplicates.
- foundSkills: skills clearly evidenced in the resume.
- skillOpportunities: important skills for the target role that are missing or weak in the resume (the "gap").
- keySkills: subset of foundSkills that are highly central to the target role.
- relevantSkills: subset of foundSkills that are still relevant but secondary.
- unusualResumeSkills: skills on the resume that are atypical or weakly related to the target role.
- If job description is empty or very short, infer typical skills for the job title for skillOpportunities and mention uncertainty in summaryNote.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "foundSkills": string[],
  "skillOpportunities": string[],
  "keySkills": string[],
  "relevantSkills": string[],
  "unusualResumeSkills": string[],
  "summaryNote": string
}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    const text = response.text || "";
    try {
      return parseSkillGapJson(text);
    } catch (parseErr) {
      console.error("analyzeSkillGap JSON parse failed", parseErr);
      return null;
    }
  } catch (e) {
    console.error("analyzeSkillGap failed", e);
    return null;
  }
};

export const getCoachResponse = async (
  userQuery: string,
  currentLessonContext: string
): Promise<string> => {
  if (!ai) {
    return "AI Coach is currently offline (API Key missing).";
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are a friendly and helpful teaching assistant named 'Coach' for an online course.
      The student is currently looking at a lesson titled: "${currentLessonContext}".
      
      Answer the student's question concisely and encouragingly.
      If the question is about the lesson, use the context of the title to infer what they might be asking about, 
      but admit if you don't have the specific transcript.
      
      Student Question: ${userQuery}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "I couldn't generate a response right now.";
  } catch (error) {
    console.error("Error querying Gemini:", error);
    return "Sorry, I encountered an error while thinking.";
  }
};

export const getAssignmentSummary = async (lessonTitle: string): Promise<string[]> => {
    if (!ai) return ["Data Analysis", "Critical Thinking", "Problem Solving"]; 

    const model = "gemini-2.5-flash";
    const prompt = `
      You are an expert curriculum designer. 
      Identify the top 3-5 specific sub-skills a student will demonstrate by completing the data analytics assignment titled: "${lessonTitle}".
      Return ONLY a JSON array of strings, e.g. ["Skill 1", "Skill 2"]. Do not add markdown formatting like \`\`\`json.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });
        const text = response.text || "";
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("AI Summary failed", e);
        return ["Data Analysis", "Critical Thinking", "Problem Solving"];
    }
};