import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const chatAssistant = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], propertiesContext: string) => {
  try {
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
        6. Use Indonesian as the primary language since the app is localized for Indonesia.`,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Maaf, saya sedang mengalami kendala teknis. Silakan coba lagi nanti.";
  }
};
