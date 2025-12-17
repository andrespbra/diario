import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIAnalysisResult {
  suggestedSolution: string;
  recommendedPriority: TicketPriority;
  isEscalationRecommended: boolean;
}

export const analyzeTicketProblem = async (problemDescription: string): Promise<AIAnalysisResult> => {
  if (!problemDescription || problemDescription.length < 5) {
     return {
         suggestedSolution: "Descrição insuficiente para análise.",
         recommendedPriority: TicketPriority.MEDIUM,
         isEscalationRecommended: false
     };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise a seguinte descrição de problema de suporte técnico: "${problemDescription}".
      Retorne um JSON com:
      1. Uma solução técnica sugerida concisa (max 2 frases).
      2. A prioridade recomendada (Baixa, Média, Alta, Crítica).
      3. Se deve ser escalado para nível 2 (booleano) baseado na gravidade ou palavras-chave de insatisfação.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedSolution: { type: Type.STRING },
            recommendedPriority: { type: Type.STRING, enum: ["Baixa", "Média", "Alta", "Crítica"] },
            isEscalationRecommended: { type: Type.BOOLEAN }
          },
          required: ["suggestedSolution", "recommendedPriority", "isEscalationRecommended"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);

    // Map string response to Enum
    let priority = TicketPriority.MEDIUM;
    switch(result.recommendedPriority) {
        case "Baixa": priority = TicketPriority.LOW; break;
        case "Média": priority = TicketPriority.MEDIUM; break;
        case "Alta": priority = TicketPriority.HIGH; break;
        case "Crítica": priority = TicketPriority.CRITICAL; break;
    }

    return {
      suggestedSolution: result.suggestedSolution,
      recommendedPriority: priority,
      isEscalationRecommended: result.isEscalationRecommended
    };

  } catch (error) {
    console.error("Error analyzing ticket with Gemini:", error);
    return {
      suggestedSolution: "Erro ao consultar IA. Verifique a conexão.",
      recommendedPriority: TicketPriority.MEDIUM,
      isEscalationRecommended: false
    };
  }
};