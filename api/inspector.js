
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

// Init Supabase (Ideally move URL to env too, but hardcoded for now matches config)
const supabase = createClient("https://inssqicvvbsdpfboazfz.supabase.co", process.env.SUPABASE_KEY || "sb_publishable_2_GInxBEmydd82C3W5aj0A_9_pBTM54");

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { context, question } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(401).json({ error: 'Missing GEMINI_API_KEY in Vercel Environment Variables' });

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

        // --- DYNAMIC PERSONA PROMPT ---
        const userPersona = context.persona || "shyam";
        let advisorPersona = "Jigri Advisor";
        let vibe = "Friendly and Professional";

        // Match Advisor Persona to User Persona (The "Mirror" Effect)
        if (["baburao", "raju", "shyam"].includes(userPersona)) {
            advisorPersona = "Baburao Style";
            vibe = "Chaotic, funny, frantic, using slang like 'Are baba!', 'Khopdi tod!', 'Paisa hi paisa hoga!'";
        } else if (["pushpa", "circuit", "munna"].includes(userPersona)) {
            advisorPersona = "Bhai Style";
            vibe = "Tapori, bold, confident, calling user 'Bhai' or 'Biddu'.";
        } else if (["poo", "chatur", "raj"].includes(userPersona)) {
            advisorPersona = "High Society";
            vibe = "Sassy, using Hinglish, maybe a bit snobbish but helpful.";
        }

        const systemPrompt = `
        You are acting as: ${advisorPersona}.
        VIBE: ${vibe}
        
        CONTEXT:
        The user is identified as: '${userPersona.toUpperCase()}'.
        
        ${infoBlock ? infoBlock : ""}
        
        USER PROFILE:
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
        
        IMPORTANT: Speak EXACTLY like ${advisorPersona}. Use catchphrases like ${advisorPersona === 'Baburao Style' ? '"Utha le re baba!"' : '"Tension nahi lene ka!"'}. Be funny but helpful.
        `;

        const result = await chatModel.generateContent(systemPrompt);
        const response = await result.response;
        return res.status(200).json({ answer: response.text() });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Failed' });
    }
}
