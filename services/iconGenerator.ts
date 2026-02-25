import { GoogleGenAI } from "@google/genai";

export const generateNatIcon = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: 'A professional, minimalist 3D isometric icon for a "Network Assets" section in a technical dashboard. The icon should feature a stylized network router or a cluster of connected nodes representing data flow. Use a color palette of indigo, slate, and silver. Clean, modern, high-tech aesthetic, soft lighting, isolated on a white background.',
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
