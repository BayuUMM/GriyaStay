import { GoogleGenAI } from "@google/genai";

// Safe wrapper to retrieve API keys without throwing "process is not defined" in browser builders like Vercel
const getGeminiApiKey = (): string => {
  try {
    // 1. Try to read from Vite's official public build variables
    const viteEnv = (import.meta as any).env || {};
    if (viteEnv.VITE_GEMINI_API_KEY) {
      return viteEnv.VITE_GEMINI_API_KEY.trim();
    }
    
    // 2. Try to read from process.env with safe lookup
    if (typeof process !== 'undefined' && process.env) {
      return (process.env.GEMINI_API_KEY || '').trim();
    }
  } catch (e) {
    console.warn("Environmental check failed in client, defaulting to empty key:", e);
  }
  return '';
};

const apiKey = getGeminiApiKey();

// Safe initialization of GoogleGenAI client (lazy / nullable fallback)
const ai = apiKey && !apiKey.includes('placeholder')
  ? new GoogleGenAI({ apiKey }) 
  : null;

export const chatAssistant = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], propertiesContext: string) => {
  try {
    if (!ai) {
      console.warn("Gemini API Client is unconfigured. VITE_GEMINI_API_KEY environment variable is missing.");
      return "Halo! Layanan asisten AI GriyaStay belum aktif karena VITE_GEMINI_API_KEY belum dikonfigurasi di environment variables Anda (Vercel/Hosting). Silakan hubungi pemilik website atau hubungi kami langsung via kontak hubungi kami. Terima kasih!";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are a helpful AI real estate assistant for 'GriyaStay', a premium property platform. 
        Your goal is to help users find properties and answer questions about the platform.
        
        Here is the current list of available properties:
        ${propertiesContext}
        
        Guidelines:
        1. Be professional, friendly, and helpful.
        2. If a user asks for recommendations, refer to the properties provided in the context.
        3. Highlight key features like VR tours, prices, and locations.
        4. If you don't know the answer or it's not about real estate/GriyaStay, politely steer the conversation back.
        5. Keep responses concise but informative.
        6. Use Indonesian as the primary language since the app is localized for Indonesia.
        7. Format responses with beautiful, scannable Markdown. Use bullet points (-) or lists for properties, use **bold** to highlight key details (like names, locations, pricing), and use clear paragraph line breaks to make answers extremely comfortable and easy to read. Avoid large blocks of dense text.`,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, asisten AI sedang mengalami kendala teknis saat menghubungi server Gemini. Silakan coba kembali sesaat lagi.";
  }
};
