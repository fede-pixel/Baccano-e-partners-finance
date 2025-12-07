import { GoogleGenAI, Chat } from "@google/genai";
import { FinancialKPIs, Transaction, Category, ProjectBudget } from "../types";
import { formatCurrency } from "../utils/calculations";
import { CATEGORY_LABELS } from "../constants";

// Helper to get API Key from Environment or LocalStorage
const getApiKey = (): string | null => {
  // 1. Check process.env (safely for browser environments)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  
  // 2. Check LocalStorage (user entered via UI)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored && stored.trim().length > 0) return stored;
  }
  return null;
};

// --- MOCK SERVICES FOR DEMO MODE ---
// Used when no API Key is available to prevent crashes and show UI capabilities

class MockChatSession {
  async sendMessage(params: { message: string }) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Fake delay
    
    const lowerMsg = params.message.toLowerCase();
    let responseText = "MODALITÀ DEMO (Senza API Key): ";

    if (lowerMsg.includes('consiglio') || lowerMsg.includes('analisi')) {
      responseText += "Dai dati attuali, il margine operativo è positivo. Consiglio di tenere sotto controllo i costi diretti dei cantieri nel prossimo trimestre per massimizzare l'utile.";
    } else if (lowerMsg.includes('fatturato') || lowerMsg.includes('ricavi')) {
      responseText += "Il fatturato è in linea con le aspettative, ma potremmo migliorare la riscossione dei crediti.";
    } else if (lowerMsg.includes('ciao')) {
      responseText += "Ciao! Sono il tuo assistente virtuale simulato. Inserisci una API Key valida nelle impostazioni per sbloccare la mia vera intelligenza.";
    } else {
      responseText += "Ho ricevuto la tua domanda. Poiché sono in modalità demo, non posso analizzare i dati in tempo reale, ma l'interfaccia funziona correttamente!";
    }

    return { text: responseText };
  }
}

// -----------------------------------

export const getFinancialAdvice = async (
  kpis: FinancialKPIs,
  topCosts: { name: string; value: number }[]
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    // Return Mock Advice
    return "💡 MODALITÀ DEMO: L'azienda mostra un buon EBITDA. Consiglio strategico simulato: ridurre le spese generali del 5% e monitorare i costi dei materiali per il Cantiere Campana.";
  }

  const ai = new GoogleGenAI({ apiKey });

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
    return "Errore API: Verifica la validità della tua chiave nelle impostazioni.";
  }
};

export const createFinancialChat = (
  kpis: FinancialKPIs,
  transactions: Transaction[],
  budgets?: ProjectBudget[]
): Chat | any => { // Return type any to allow MockChatSession
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("No API Key found, using Mock Chat Session");
    return new MockChatSession();
  }

  const ai = new GoogleGenAI({ apiKey });

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