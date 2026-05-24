import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { chatAssistant } from '../services/geminiService';
import { Property } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatAssistantProps {
  properties: Property[];
}

export const ChatAssistant = ({ properties }: ChatAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya asisten AI GriyaStay. Ada yang bisa saya bantu hari ini?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const propertiesContext = properties.map(p => 
    `- ${p.title} di ${p.location}: Rp${p.price.toLocaleString()} per malam. Fitur: ${p.features.join(', ')}.`
  ).join('\n');

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await chatAssistant(userMessage, history, propertiesContext);
    
    setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Button and Label */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3 pointer-events-none">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.8 }}
              className="bg-white px-4 py-2 rounded-xl shadow-xl border border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 pointer-events-auto"
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              Tanya Asisten AI
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1, rotate: isOpen ? -90 : 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 ${isOpen ? 'bg-slate-900' : 'bg-rose-600'} text-white rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.2)] flex items-center justify-center group overflow-hidden relative pointer-events-auto transition-colors duration-300`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div
             key={isOpen ? 'close' : 'open'}
             initial={{ opacity: 0, rotate: isOpen ? 90 : -90 }}
             animate={{ opacity: 1, rotate: 0 }}
             transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={32} /> : <MessageSquare size={32} fill="currentColor" />}
          </motion.div>
          
          {!isOpen && (
            <div className="absolute top-4 right-4 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-rose-600 shadow-sm" />
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-4 right-4 sm:right-auto sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] h-[500px] sm:h-[550px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Asisten AI GriyaStay</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Always Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white text-slate-400 shadow-sm border border-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs italic">Mengetik...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative"
              >
                <input 
                  type="text"
                  placeholder="Tanya tentang properti..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 px-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2 top-1.5 w-9 h-9 bg-slate-900 text-white rounded-full flex items-center justify-center disabled:bg-slate-200 disabled:text-slate-400 transition-all hover:scale-105 active:scale-95"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Didukung oleh AI. Mungkin memiliki keterbatasan.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
