import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI(
    { apiKey: process.env.GEMINI_API_KEY }
);

export async function generateContent(text: string, instruction?: string) {
  const prompt = instruction 
    ? `${instruction}\n\nText: ${text}`
    : text;
    
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return response.text;
}