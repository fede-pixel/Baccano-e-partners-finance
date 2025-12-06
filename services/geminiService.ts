import { GoogleGenAI } from "@google/genai";
import { FinancialKPIs, Transaction } from "../types";
import { formatCurrency } from "../utils/calculations";

export const getFinancialAdvice = async (
  kpis: FinancialKPIs,
  topCosts: { name: string; value: number }[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key non configurata. Impossibile contattare l'advisor AI.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Agisci come un CFO (Chief Financial Officer) esperto per la società "Baccano & Partners SRLS" di Roma.
    Analizza i seguenti dati finanziari attuali:

    - Fatturato: ${formatCurrency(kpis.revenue)}
    - Costi Cantieri (COGS): ${formatCurrency(kpis.cogs)}
    - Margine Lordo: ${formatCurrency(kpis.grossMargin)}
    - Spese Operative (Marketing, HR, Fissi): ${formatCurrency(kpis.opex)}
    - EBITDA (MOL): ${formatCurrency(kpis.ebitda)}
    - Utile Netto Stimato: ${formatCurrency(kpis.netIncome)}

    Le voci di costo maggiori sono:
    ${topCosts.map(c => `- ${c.name}: ${formatCurrency(c.value)}`).join('\n')}

    Fornisci una breve analisi strategica (max 200 parole) in Italiano.
    1. Identifica un punto di forza.
    2. Identifica un punto critico o un rischio.
    3. Dai un consiglio pratico su dove investire o dove tagliare costi per ottimizzare l'EBITDA.
    Usa un tono professionale ma diretto.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Nessun consiglio generato.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Si è verificato un errore durante l'analisi dei dati.";
  }
};