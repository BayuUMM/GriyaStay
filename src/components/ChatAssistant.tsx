import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { chatAssistant } from '../services/geminiService';
import { Property } from '../types';
import Markdown from 'react-markdown';

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
    { role: 'model', text: 'Halo! Saya asisten AI GriyaStay. Saya dapat membantu mencari produk, memberikan rekomendasi villa atau homestay terbaik, memandu Anda mendaftarkan properti untuk dijual, serta menjawab pertanyaan seputar platform kami. Ada yang ingin ditanyakan hari ini?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const propertiesContext = properties.map(p => 
    `- ${p.title} di ${p.location}: Rp${p.price.toLocaleString()} per malam. Fitur: ${p.features.join(', ')}.`
  ).join('\n');

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = textToSend.trim();
    if (!customText) {
      setInputText('');
    }
    
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

  const handleClearChat = () => {
    let confirmClear = false;
    try {
      confirmClear = window.confirm('Apakah Anda ingin menghapus seluruh riwayat percakapan dengan Asisten AI?');
    } catch (e) {
      // Clean fallback if window.confirm is restricted/blocked in sandboxed environment
      confirmClear = true;
    }
    if (confirmClear) {
      setMessages([
        { role: 'model', text: 'Halo! Saya asisten AI GriyaStay. Saya dapat membantu mencari produk, memberikan rekomendasi villa atau homestay terbaik, memandu Anda mendaftarkan properti untuk dijual, serta menjawab pertanyaan seputar platform kami. Ada yang ingin ditanyakan hari ini?' }
      ]);
    }
  };

  const suggestionChips = [
    { label: '🏡 Cari Villa Murah', query: 'Rekomendasikan villa paling murah dengan fasilitas kolam renang yang tersedia.' },
    { label: '📍 Rekomendasi di Malang', query: 'Apakah ada properti yang berlokasi di daerah Malang atau Batu? Tolong tunjukkan.' },
    { label: '🔑 Cara Menjual Properti', query: 'Saya ingin menjual properti saya di website GriyaStay. Bagaimana caranya dan apa saja syaratnya?' },
    { label: '✨ Keunggulan VR Tour', query: 'Apa itu fitur VR Tour GriyaStay dan bagaimana cara menggunakannya?' }
  ];

  return (
    <>
      {/* Floating Button and Notification Label */}
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2.5 pointer-events-none">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-rose-100 text-[11px] font-bold text-slate-800 flex items-center gap-2 pointer-events-auto cursor-pointer"
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.03 }}
            >
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span>Tanya GriyaStay AI</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 ${isOpen ? 'bg-slate-900 border-slate-850' : 'bg-rose-600 border-rose-500'} text-white rounded-full shadow-[0_12px_40px_rgba(225,29,72,0.25)] flex items-center justify-center group overflow-hidden relative pointer-events-auto border transition-all duration-300`}
          id="btn-ai-assistant"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div
             key={isOpen ? 'close' : 'open'}
             initial={{ opacity: 0, rotate: isOpen ? 90 : -90 }}
             animate={{ opacity: 1, rotate: 0 }}
             transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={26} /> : <MessageSquare size={26} fill="currentColor" />}
          </motion.div>
          
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center" />
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.93, transformOrigin: 'bottom left' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.93 }}
            className="fixed bottom-24 left-4 right-4 sm:right-auto sm:left-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] h-[550px] sm:h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.15)] flex flex-col border border-slate-100/90 overflow-hidden font-sans"
            id="chat-assistant-container"
          >
            {/* Header with Luxury Glow & Action buttons */}
            <div className="bg-slate-950 p-4 flex items-center justify-between text-white border-b border-white/5 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Sparkles size={18} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white/95">GriyaStay AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-white/60 font-semibold tracking-wider">SIAP MEMBANTU 24/7</span>
                  </div>
                </div>
              </div>

              {/* Chat action controls */}
              <div className="flex items-center gap-1.5 relative z-10">
                {messages.length > 1 && (
                  <button 
                    onClick={handleClearChat}
                    title="Mulai Ulang Percakapan"
                    className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    id="btn-reset-chat"
                  >
                    <RefreshCw size={15} />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  id="btn-close-chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 custom-scrollbar"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    key={idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 flex-shrink-0 mt-0.5">
                        <Bot size={14} className="stroke-[2.5px]" />
                      </div>
                    )}
                    
                    <div className="flex flex-col max-w-[82%]">
                      {/* Name tag */}
                      <span className={`text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                        {isUser ? 'Anda' : 'GriyaStay Assistant'}
                      </span>
                      
                      {/* Bubble block */}
                      <div className={`rounded-2xl px-4 py-3 leading-relaxed shadow-sm text-xs md:text-[13px] ${
                        isUser 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-normal'
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-line font-medium">{msg.text}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none text-slate-700">
                            <Markdown
                              components={{
                                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed font-normal">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-4.5 mb-2.5 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4.5 mb-2.5 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="marker:text-rose-500 pl-0.5 leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold text-slate-950 bg-rose-50/50 hover:bg-rose-50 px-1 py-[1px] rounded text-xs md:text-[13px] transition-colors">{children}</strong>,
                                h1: ({ children }) => <h1 className="text-sm font-extrabold text-slate-950 mt-4 mb-1.5 border-b border-slate-100 pb-1">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xs font-bold text-slate-950 mt-3.5 mb-1">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-xs font-semibold text-slate-900 mt-3 mb-1">{children}</h3>,
                                a: ({ children, href }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700 underline font-semibold inline-flex items-center gap-0.5">
                                    {children}
                                  </a>
                                )
                              }}
                            >
                              {msg.text}
                            </Markdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100 flex-shrink-0 mt-0.5 animate-pulse">
                    <Bot size={14} className="stroke-[2.5px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 ml-1">
                      GriyaStay Assistant
                    </span>
                    <div className="bg-white text-slate-500 shadow-sm border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs">
                      <Loader2 size={13} className="animate-spin text-rose-500" />
                      <span className="italic font-medium animate-pulse text-slate-400">Sedang menyusun rekomendasi...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggestions Panel (Hidden when starting customized conversations, always shown near starter) */}
              <AnimatePresence>
                {messages.length < 3 && !isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="pt-2 !mt-6"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                      💡 Coba tanyakan ini ke AI:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionChips.map((chip, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.02, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSend(chip.query)}
                          className="text-left text-[11px] font-semibold text-slate-700 bg-white border border-slate-200/85 px-3 py-2 rounded-xl shadow-xs transition-colors cursor-pointer block"
                        >
                          {chip.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Refined Input Area */}
            <div className="p-3.5 bg-white border-t border-slate-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
              >
                <input 
                  type="text"
                  placeholder="Ketik pertanyaan untuk asisten..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all font-sans text-slate-800"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isTyping}
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="absolute right-2.5 w-8.5 h-8.5 bg-slate-900 border border-slate-850 hover:bg-rose-600 disabled:hover:bg-slate-200 text-white rounded-xl flex items-center justify-center disabled:bg-slate-100 disabled:border-slate-150 disabled:text-slate-400 transition-all active:scale-95 cursor-pointer shadow-sm"
                  id="btn-send-ai-message"
                >
                  <Send size={14} className="transform rotate-0" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <span className="text-[10px] text-center text-slate-400">
                  Didukung oleh Gemini AI Flash. Respon Anda dijamin aman.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
