import { GoogleGenAI, Chat } from "@google/genai";
import { FinancialKPIs, Transaction, Category, ProjectBudget } from "../types";
import { formatCurrency } from "../utils/calculations";
import { CATEGORY_LABELS } from "../constants";

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

export const createFinancialChat = (
  kpis: FinancialKPIs,
  transactions: Transaction[],
  budgets?: ProjectBudget[]
): Chat | null => {
  if (!process.env.API_KEY) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format data for the AI Context - Including Project Names
  const transactionsList = transactions
    .slice(0, 300) // Increased limit slightly
    .map(t => `- ${t.date.split('T')[0]}: ${t.description} | ${formatCurrency(t.amount)} | ${t.type} | Cat: ${CATEGORY_LABELS[t.category]} | Progetto: ${t.project || 'Generale'}`)
    .join('\n');

  let budgetContext = "";
  if (budgets && budgets.length > 0) {
      budgetContext = "CONFRONTO PREVENTIVO (BUDGET) vs REALE:\n" + budgets.map(b => 
          `- Cantiere "${b.projectName}": Preventivo Ricavi ${formatCurrency(b.budgetRevenue)}, Budget Costi ${formatCurrency(b.budgetCost)}.`
      ).join('\n');
  } else {
      budgetContext = "Non sono stati impostati budget preventivi per i cantieri.";
  }

  const contextData = `
    DATI AZIENDALI "Baccano & Partners SRLS":
    
    KPI ATTUALI AZIENDALI:
    - Fatturato Totale: ${formatCurrency(kpis.revenue)}
    - Costi Diretti (Cantieri): ${formatCurrency(kpis.cogs)}
    - Margine Lordo: ${formatCurrency(kpis.grossMargin)}
    - Spese Operative (Mkt, HR, Fissi): ${formatCurrency(kpis.opex)}
    - EBITDA (MOL): ${formatCurrency(kpis.ebitda)}
    - Utile Netto (Stima): ${formatCurrency(kpis.netIncome)}
    - Tasse Stimate: ${formatCurrency(kpis.taxes)}

    ${budgetContext}
    
    ULTIME TRANSAZIONI (Con dettaglio Cantiere/Progetto):
    ${transactionsList}
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `Sei l'Assistente AI Intelligente e CFO di "Baccano & Partners SRLS".
      Hai accesso a tutti i movimenti finanziari, e soprattutto ai BUDGET (Preventivi) dei cantieri.

      Ecco i dati aggiornati a cui hai accesso:
      ${contextData}

      Regole:
      1. Rispondi sempre in Italiano.
      2. Quando ti chiedono come va un cantiere, controlla se sta rispettando il budget di costo. Se ha speso più del budget, segnalalo come criticità.
      3. Analizza se il fatturato reale è in linea con il preventivo.
      4. Sii proattivo: se vedi un cantiere che ha costi alti ma ricavi bassi rispetto al preventivo, suggerisci di controllare i SAL (Stati Avanzamento Lavori).
      `
    }
  });
};