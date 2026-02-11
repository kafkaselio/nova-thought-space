
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartSuggestions = async (content: string) => {
  if (!content || !process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a category and 3 tags for the following note: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            prioritySuggestion: { type: Type.STRING, description: "One of: High, Medium, Low, Someday" }
          },
          required: ["category", "tags", "prioritySuggestion"]
        }
      }
    });

    // response.text is a property, not a method.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
