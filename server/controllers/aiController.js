import {
    generateAIResponse
} from "../services/geminiService.js";


// ==========================================
// FARMER AI ASSISTANT
// ==========================================

export const farmerAI = async (req, res) => {

    try {

        const {
            question
        } = req.body || {};


        // ==========================================
        // VALIDATE QUESTION
        // ==========================================

        if (
            typeof question !== "string" ||
            !question.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Question is required"
            });
        }


        const cleanQuestion =
            question.trim();


        // ==========================================
        // LIMIT QUESTION LENGTH
        // ==========================================

        if (cleanQuestion.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "Question is too long. Please keep it under 2000 characters."
            });
        }


        // ==========================================
        // AI PROMPT
        // ==========================================

        const prompt = `

You are an intelligent agricultural assistant
for an Indian Farmer-to-Consumer platform.

Your job is to help farmers with practical,
easy-to-understand agricultural information.

Farmer question:

"${cleanQuestion}"

Provide a useful answer.

Rules:

1. Use simple language.
2. Consider Indian farming conditions.
3. Give practical steps.
4. Use bullet points where useful.
5. If discussing crops, mention suitable
   conditions when relevant.
6. Never claim certainty for serious
   agricultural, pesticide, or disease issues.
7. For serious crop disease or pesticide
   decisions, recommend consulting a
   qualified agricultural expert.
8. Do not make up exact market prices.
9. Keep the response concise but useful.
10. Do not provide dangerous or illegal
    instructions.
11. If the question is unrelated to
    agriculture, politely explain that you
    are focused on agricultural assistance.

`;


        // ==========================================
        // GENERATE AI RESPONSE
        // ==========================================

        const answer =
            await generateAIResponse(
                prompt
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            answer

        });

    } catch (error) {

        console.error(
            "FARMER AI CONTROLLER ERROR:",
            error
        );


        // ==========================================
        // GEMINI RATE LIMIT
        // ==========================================

        if (
            error.status === 429 ||
            error.statusCode === 429 ||
            error.message?.toLowerCase()
                .includes("rate")
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "AI usage limit reached. Please try again later."
            });
        }


        // ==========================================
        // GEMINI SERVICE UNAVAILABLE
        // ==========================================

        if (
            error.status === 503 ||
            error.statusCode === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "AI service is temporarily unavailable. Please try again."
            });
        }


        res.status(500).json({

            success: false,

            message:
                "Failed to generate AI response"

        });

    }

};


// ==========================================
// AI PRODUCT DESCRIPTION GENERATOR
// ==========================================

export const generateProductDescription = async (
    req,
    res
) => {

    try {

        const {
            name,
            category,
            location,
            isOrganic
        } = req.body || {};


        // ==========================================
        // VALIDATE PRODUCT NAME
        // ==========================================

        if (
            typeof name !== "string" ||
            !name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name is required"
            });
        }


        const cleanName =
            name.trim();


        // ==========================================
        // LIMIT PRODUCT NAME
        // ==========================================

        if (cleanName.length > 200) {
            return res.status(400).json({
                success: false,
                message:
                    "Product name is too long"
            });
        }


        // ==========================================
        // CLEAN OPTIONAL VALUES
        // ==========================================

        const cleanCategory =
            typeof category === "string" &&
            category.trim()
                ? category.trim()
                : "Not specified";


        const cleanLocation =
            typeof location === "string" &&
            location.trim()
                ? location.trim()
                : "India";


        // ==========================================
        // AI PROMPT
        // ==========================================

        const prompt = `

You are an AI assistant for an Indian
Farmer-to-Consumer marketplace.

Generate a professional and attractive
product description for a farmer's product.

Product Name:
${cleanName}

Category:
${cleanCategory}

Location:
${cleanLocation}

Organic:
${isOrganic ? "Yes" : "No"}

Requirements:

1. Write 3 to 5 short sentences.
2. Use simple English.
3. Make it attractive for customers.
4. Highlight freshness and quality when appropriate.
5. Mention the farming location only if provided.
6. Do not invent certifications.
7. Do not make unsupported health claims.
8. Do not invent nutritional values.
9. Do not mention fake prices.
10. Do not claim the product is organic unless
    the provided Organic value is Yes.
11. Return only the product description.

`;


        // ==========================================
        // GENERATE DESCRIPTION
        // ==========================================

        const description =
            await generateAIResponse(
                prompt
            );


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({

            success: true,

            description

        });

    } catch (error) {

        console.error(
            "AI PRODUCT DESCRIPTION ERROR:",
            error
        );


        // ==========================================
        // GEMINI RATE LIMIT
        // ==========================================

        if (
            error.status === 429 ||
            error.statusCode === 429 ||
            error.message?.toLowerCase()
                .includes("rate")
        ) {
            return res.status(429).json({
                success: false,
                message:
                    "AI usage limit reached. Please try again later."
            });
        }


        // ==========================================
        // GEMINI SERVICE UNAVAILABLE
        // ==========================================

        if (
            error.status === 503 ||
            error.statusCode === 503
        ) {
            return res.status(503).json({
                success: false,
                message:
                    "AI service is temporarily unavailable. Please try again."
            });
        }


        res.status(500).json({
            success: false,
            message:
                "Failed to generate product description"
        });
    }
};