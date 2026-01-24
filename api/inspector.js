
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

// Init Supabase (Ideally move URL to env too, but hardcoded for now matches config)
const supabase = createClient("https://inssqicvvbsdpfboazfz.supabase.co", process.env.SUPABASE_KEY || "sb_publishable_2_GInxBEmydd82C3W5aj0A_9_pBTM54");

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { context, question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'Server Config Error' });

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const embedModel = genAI.getGenerativeModel({ model: "embedding-001" });
        const chatModel = genAI.getGenerativeModel({ model: "gemini-pro" });

        // --- RAG STEP 1: RETRIEVE KNOWLEDGE ---
        let infoBlock = "";
        try {
            // Embed the User's Query (or Profile if query is empty)
            const queryText = question || `Planning for ${context.persona}`;
            const eResult = await embedModel.embedContent(queryText);
            const vector = eResult.embedding.values;

            // Search DB
            const { data: rules } = await supabase.rpc('match_knowledge', {
                query_embedding: vector,
                match_threshold: 0.6, // Lower threshold to ensure we get *some* rules
                match_count: 3
            });

            if (rules && rules.length > 0) {
                infoBlock = "EXPERT GUIDELINES (Strictly follow these):\n" +
                    rules.map(r => `- ${r.content}`).join("\n");
            }
        } catch (e) {
            console.warn("RAG Retrieval Failed:", e);
            // Continue without RAG, don't crash
        }

        // --- RAG STEP 2: GENERATE WITH CONTEXT ---
        const systemPrompt = `
        You are 'Jigri Advisor', a friendly, Bollywood-savvy Indian financial expert.
        
        ${infoBlock ? infoBlock : ""}
        
        USER PROFILE:
        - Persona: ${context.persona || "Unknown"}
        - Income: ₹${context.income || 0}
        - Goals: ${JSON.stringify(context.goals || [])}
        - State: ${context.demographics?.state || "India"}
        - Device OS: ${context.demographics?.os || "Unknown"}

        THEIR PLAN:
        ${JSON.stringify(context.allocation || {})}

        User Question: "${question}"

        TASK:
        1. If asked about APPS/PLATFORMS:
           - Recommend specifically 3 apps based on their OS (${context.demographics?.os || "Unknown"}).
           - Prioritize: Low Cost > Trust > Latest Tech.
           - Give a reason for each (e.g., "Best for iOS", "Cheapest for MFs").
        2. Otherwise:
           - Answer the financial question using the EXPERT GUIDELINES above.
           - Cite rules naturally.
        
        Keep the Bollywood tone alive!
        `;

        const result = await chatModel.generateContent(systemPrompt);
        const response = await result.response;
        return res.status(200).json({ answer: response.text() });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Failed' });
    }
}
