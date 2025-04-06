import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AttendanceData {
  date: string;
  status: string;
  confidence: number;
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VITE_GEMINI_API_KEY is missing. Please check your .env file.");
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeAttendancePatterns(attendanceData: AttendanceData[]) {
    try {
      console.log('Starting Gemini AI analysis with timeout...');
      
      // Create a promise with timeout
      const generateWithTimeout = async (timeoutMs = 15000) => {
        return new Promise<string>(async (resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Gemini AI request timed out after ' + timeoutMs + 'ms'));
          }, timeoutMs);
          
          try {
            const prompt = `Analyze the following attendance data and provide insights about attendance patterns, frequent absentees, and recommendations for improvement:\n${JSON.stringify(attendanceData, null, 2)}`;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();
            
            clearTimeout(timeoutId);
            resolve(text);
          } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
          }
        });
      };
      
      const text = await generateWithTimeout();
      console.log('Gemini AI response received');
      return text;
    } catch (error) {
      console.error("Error analyzing attendance patterns:", error);
      // Return a fallback message instead of throwing to allow the process to continue
      return "Unable to generate AI insights at this time. Please try again later.";
    }
  }
}

export const geminiAIService = new GeminiAIService();
export default geminiAIService;
