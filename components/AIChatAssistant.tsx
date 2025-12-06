import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { Transaction, FinancialKPIs } from '../types';
import { createFinancialChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface AIChatAssistantProps {
  transactions: Transaction[];
  kpis: FinancialKPIs;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ transactions, kpis }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Ciao! Sono il tuo assistente finanziario AI. Conosco tutti i dati di Baccano & Partners. Come posso aiutarti oggi?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or Update Chat Context when opening or when data changes drastically
  // Ideally, we re-init when opening to capture latest state.
  useEffect(() => {
    if (isOpen && !chatSessionRef.current) {
      chatSessionRef.current = createFinancialChat(kpis, transactions);
    }
  }, [isOpen, kpis, transactions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Re-initialize if null (shouldn't happen if useEffect works, but for safety)
    if (!chatSessionRef.current) {
        chatSessionRef.current = createFinancialChat(kpis, transactions);
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (chatSessionRef.current) {
        const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
        const aiResponse = result.text;
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          text: aiResponse || "Mi dispiace, non ho potuto elaborare una risposta." 
        }]);
      } else {
        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: "Errore di connessione: API Key mancante o servizio non disponibile." 
        }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Si è verificato un errore durante la comunicazione con l'AI." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-50"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ height: '500px', maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">Baccano AI Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}>
                  <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                    {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                    {msg.role === 'user' ? 'Tu' : 'AI'}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm">
                   <div className="flex gap-1">
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chiedi qualcosa sui dati..."
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl w-10 h-10 flex items-center justify-center transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              L'IA può commettere errori. Verifica le informazioni importanti.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatAssistant;