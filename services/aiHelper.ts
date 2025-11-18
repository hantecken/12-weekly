import { GoogleGenAI, Type } from "@google/genai";
import { Goal, Tactic, TaskStatus } from "../types";
import { generateId } from "./storage";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `你是一位精通「12 週的一年 (12 Week Year)」方法的生產力教練。
你的目標是協助使用者建立可執行、高影響力的計畫。
請專注於執行力、領先指標 (Leading Indicators) 和時間方塊 (Time-blocking)。
**所有回應必須嚴格使用繁體中文 (Traditional Chinese)。**
保持回答簡潔直接。`;

/**
 * Enhances a rough vision statement into a compelling 3-year vision.
 */
export const enhanceVisionWithAI = async (currentVision: string): Promise<string> => {
  if (!currentVision.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `請將以下願景草稿重寫並潤飾，使其成為一段針對 3 年後、具啟發性、具體且情感豐富的願景聲明。字數請控制在 150 字以內，並使用繁體中文。\n\n目前草稿: "${currentVision}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });
    return response.text || currentVision;
  } catch (error) {
    console.error("AI Vision Enhancement Failed:", error);
    throw error;
  }
};

/**
 * Suggests 12-week goals based on the vision.
 */
export const suggestGoalsWithAI = async (vision: string): Promise<Goal[]> => {
  if (!vision.trim()) return [];

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `根據這個願景：「${vision}」，建議 3 個具體、高影響力且符合 SMART 原則的 12 週目標。請確保輸出為繁體中文。`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "簡短有力的目標標題 (繁體中文)" },
              description: { type: Type.STRING, description: "符合 SMART 原則的詳細描述 (繁體中文)" },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    const rawGoals = JSON.parse(response.text || "[]");
    
    return rawGoals.map((g: any) => ({
      id: generateId(),
      title: g.title,
      description: g.description,
      progress: 0,
      tactics: []
    }));

  } catch (error) {
    console.error("AI Goal Suggestion Failed:", error);
    throw error;
  }
};

/**
 * Generates weekly tactics for a specific goal.
 */
export const generateTacticsWithAI = async (goalTitle: string, goalDescription: string, existingTacticsCount: number): Promise<Tactic[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `針對目標「${goalTitle}」(${goalDescription})，生成 5 個本週可執行的具體策略或一次性行動。這些應該是具有高槓桿效益的活動。請確保輸出為繁體中文。`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "可執行的任務名稱 (繁體中文)" },
              durationMinutes: { type: Type.INTEGER, description: "預估時間分鐘數 (例如 30, 60, 90)" },
            },
            required: ["title", "durationMinutes"],
          },
        },
      },
    });

    const rawTactics = JSON.parse(response.text || "[]");

    return rawTactics.map((t: any) => ({
      id: generateId(),
      title: t.title,
      durationMinutes: t.durationMinutes,
      status: TaskStatus.PENDING,
      // Note: linkedGoalId must be assigned by the caller
      linkedGoalId: "" 
    }));

  } catch (error) {
    console.error("AI Tactic Generation Failed:", error);
    throw error;
  }
};