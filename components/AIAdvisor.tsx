import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { FinancialKPIs, Transaction, ProjectBudget } from '../types';
import { createFinancialChat } from '../services/geminiService';
import { Chat } from '@google/genai';

interface AIAdvisorProps {
  kpis: FinancialKPIs;
  transactions: Transaction[];
  budgets: ProjectBudget[];
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ kpis, transactions, budgets }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init', 
      role: 'model', 
      text: 'Ciao! Sono il tuo CFO Virtuale. Analizzo preventivi e consuntivi dei tuoi cantieri. Chiedimi pure un consiglio.' 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat session
  useEffect(() => {
    chatSessionRef.current = createFinancialChat(kpis, transactions, budgets);
  }, [kpis, transactions, budgets]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!chatSessionRef.current) {
         chatSessionRef.current = createFinancialChat(kpis, transactions, budgets);
    }

    const userText = input;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      if (chatSessionRef.current) {
          const result = await chatSessionRef.current.sendMessage({ message: userText });
          const responseText = result.text;
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText
          }]);
      } else {
           setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'Errore: API Key mancante.' }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'Mi dispiace, si è verificato un errore.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-xl shadow-lg flex flex-col h-[600px] border border-indigo-500/20">
       {/* Header */}
       <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
             <Sparkles size={20} className="text-indigo-300" />
          </div>
          <div>
            <h2 className="font-bold text-lg">AI CFO Advisor</h2>
            <div className="text-xs text-indigo-200 flex items-center gap-1">
               <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
               Online & Connected
            </div>
          </div>
       </div>

       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-500/30 scrollbar-track-transparent" ref={scrollRef}>
          {messages.map(msg => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white/10 text-slate-100 border border-white/10 rounded-bl-none'
                }`}>
                   {msg.text}
                </div>
             </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
               <div className="bg-white/10 rounded-2xl rounded-bl-none p-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-indigo-300" />
                  <span className="text-xs text-indigo-200">Analisi in corso...</span>
               </div>
            </div>
          )}
       </div>

       {/* Input */}
       <div className="p-4 bg-black/20 border-t border-white/10">
          <div className="flex gap-2 relative">
             <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Chiedi un'analisi o un consiglio..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
             />
             <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
             >
                <Send size={16} />
             </button>
          </div>
          <div className="text-[10px] text-center text-slate-500 mt-2">
              Accesso completo ai dati di bilancio e cantieri.
          </div>
       </div>
    </div>
  );
};

export default AIAdvisor;