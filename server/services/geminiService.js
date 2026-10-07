import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const generateAIResponse = async (prompt) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing in .env");
        }

        console.log("Sending request to Gemini...");

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt
        });

        console.log("Gemini response received.");

        return response.text;

    } catch (error) {
        console.error("GEMINI API ERROR:", error);

        if (
            error.status === 429 ||
            error.statusCode === 429
        ) {
            throw new Error(
                "Gemini API limit reached. Please try again later."
            );
        }

        if (
            error.status === 503 ||
            error.statusCode === 503
        ) {
            throw new Error(
                "Gemini is currently busy. Please try again."
            );
        }

        throw new Error(
            "AI service is currently unavailable."
        );
    }
};